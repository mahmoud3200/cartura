import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import type { CreateOutboxEventInput } from "./outbox.types.js";

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

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
            OR: [
              { claimedAt: null },
              { claimedAt: { lte: staleBefore } },
            ],
          },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  }

  async claim(input: {
    eventId: string;
    availableAt: Date;
    staleBefore: Date;
    claimToken: string;
  }): Promise<boolean> {
    const claimed = await prisma.outboxEvent.updateMany({
      where: {
        id: input.eventId,
        OR: [
          { status: "pending", availableAt: { lte: input.availableAt } },
          {
            status: "processing",
            OR: [
              { claimedAt: null },
              { claimedAt: { lte: input.staleBefore } },
            ],
          },
        ],
      },
      data: {
        status: "processing",
        attempts: { increment: 1 },
        claimToken: input.claimToken,
        claimedAt: input.availableAt,
      },
    });

    return claimed.count === 1;
  }

  async markProcessed(eventId: string, claimToken: string) {
    const updated = await prisma.outboxEvent.updateMany({
      where: { id: eventId, status: "processing", claimToken },
      data: {
        status: "processed",
        processedAt: new Date(),
        lastError: null,
        claimToken: null,
        claimedAt: null,
      },
    });

    return updated.count === 1;
  }

  markFailedOrPending(input: {
    eventId: string;
    claimToken: string;
    failed: boolean;
    availableAt: Date;
    lastError: string;
  }) {
    return prisma.outboxEvent.updateMany({
      where: {
        id: input.eventId,
        status: "processing",
        claimToken: input.claimToken,
      },
      data: {
        status: input.failed ? "failed" : "pending",
        availableAt: input.availableAt,
        lastError: input.lastError,
        claimToken: null,
        claimedAt: null,
      },
    });
  }
}

export type OutboxEventRecord = Awaited<
  ReturnType<OutboxRepository["findPending"]>
>[number];

export const outboxRepository = new OutboxRepository();
