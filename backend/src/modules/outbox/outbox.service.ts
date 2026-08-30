import { randomUUID } from "node:crypto";

import {
  notificationsService,
  type NotificationsService,
} from "../notifications/notifications.service.js";
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
    private readonly notifier: NotificationsService = notificationsService,
  ) {}

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
      const claimToken = randomUUID();

      if (!(await this.repository.claim({
        eventId: event.id,
        availableAt: now,
        staleBefore,
        claimToken,
      }))) {
        continue;
      }

      try {
        await this.processEvent(event);
        if (await this.repository.markProcessed(event.id, claimToken)) {
          processed += 1;
        }
      } catch (error) {
        const attempts = event.attempts + 1;
        await this.repository.markFailedOrPending({
          eventId: event.id,
          claimToken,
          failed: attempts >= OUTBOX_MAX_ATTEMPTS,
          availableAt: nextOutboxAttemptAt(attempts),
          lastError: getOutboxErrorMessage(error),
        });
      }
    }

    return processed;
  }

  private async processEvent(event: OutboxEventRecord) {
    const notification = getNotificationFromOutboxPayload(event);

    await this.notifier.create({
      ...notification,
      sourceEventId: event.id,
    });
  }
}

export const outboxService = new OutboxService();
