import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import type {
  CreateOutboxEventInput,
  PrismaExecutor,
} from "./outbox.types.js";

export class OutboxRepository {
  create(input: CreateOutboxEventInput, client: PrismaExecutor = prisma) {
    return client.outboxEvent.create({
      data: {
        aggregateType: input.aggregateType,
        aggregateId: input.aggregateId,
        eventType: input.eventType,
        payload: input.payload as Prisma.InputJsonValue,
        status: "pending",
        availableAt: input.availableAt ?? new Date(),
      },
    });
  }

  findPending(limit: number, availableAt: Date, staleBefore: Date) {
    return prisma.outboxEvent.findMany({
      where: {
        OR: [
          {
            status: "pending",
            availableAt: { lte: availableAt },
          },
          {
            status: "processing",
            updatedAt: { lte: staleBefore },
          },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  }

  async claim(eventId: string, staleBefore: Date): Promise<boolean> {
    const claimed = await prisma.outboxEvent.updateMany({
      where: {
        id: eventId,
        OR: [
          { status: "pending" },
          {
            status: "processing",
            updatedAt: { lte: staleBefore },
          },
        ],
      },
      data: {
        status: "processing",
        attempts: { increment: 1 },
      },
    });

    return claimed.count === 1;
  }

  markProcessed(eventId: string) {
    return prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: "processed",
        processedAt: new Date(),
        lastError: null,
      },
    });
  }

  markFailedOrPending(input: {
    eventId: string;
    failed: boolean;
    availableAt: Date;
    lastError: string;
  }) {
    return prisma.outboxEvent.update({
      where: { id: input.eventId },
      data: {
        status: input.failed ? "failed" : "pending",
        availableAt: input.availableAt,
        lastError: input.lastError,
      },
    });
  }
}

export type OutboxEventRecord = Awaited<
  ReturnType<OutboxRepository["findPending"]>
>[number];

export const outboxRepository = new OutboxRepository();
