import { notificationsService } from "../notifications/index.js";
import type {
  CreateNotificationOutboxInput,
  CreateOutboxEventInput,
  PrismaExecutor,
} from "./outbox.types.js";
import {
  getNotificationFromOutboxPayload,
  getOutboxErrorMessage,
  nextOutboxAttemptAt,
  OUTBOX_CLAIM_TIMEOUT_MS,
  OUTBOX_MAX_ATTEMPTS,
} from "./outbox.utils.js";
import {
  outboxRepository,
  type OutboxEventRecord,
  type OutboxRepository,
} from "./outbox.repository.js";

export class OutboxService {
  constructor(
    private readonly repository: OutboxRepository = outboxRepository,
  ) {}

  create(input: CreateOutboxEventInput, client?: PrismaExecutor) {
    return this.repository.create(input, client);
  }

  createNotificationEvent(
    input: CreateNotificationOutboxInput,
    client?: PrismaExecutor,
  ) {
    return this.create(
      {
        aggregateType: input.aggregateType,
        aggregateId: input.aggregateId,
        eventType: input.eventType,
        payload: {
          notification: input.notification,
        },
        availableAt: input.availableAt,
      },
      client,
    );
  }

  async processBatch(limit = 25): Promise<number> {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - OUTBOX_CLAIM_TIMEOUT_MS);
    const events = await this.repository.findPending(
      limit,
      now,
      staleBefore,
    );
    let processed = 0;

    for (const event of events) {
      if (!(await this.repository.claim(event.id, staleBefore))) {
        continue;
      }

      try {
        await this.processEvent(event);
        await this.repository.markProcessed(event.id);
        processed += 1;
      } catch (error) {
        const attempts = event.attempts + 1;
        await this.repository.markFailedOrPending({
          eventId: event.id,
          failed: attempts >= OUTBOX_MAX_ATTEMPTS,
          availableAt: nextOutboxAttemptAt(attempts),
          lastError: getOutboxErrorMessage(error),
        });
      }
    }

    return processed;
  }

  private async processEvent(event: OutboxEventRecord) {
    const notification = getNotificationFromOutboxPayload(
      event.payload,
      event.eventType,
    );

    if (!notification) {
      return;
    }

    await notificationsService.create({
      ...notification,
      sourceEventId: event.id,
    });
  }
}

export const outboxService = new OutboxService();
