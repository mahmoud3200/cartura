import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";

export type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export type CreateOutboxEventInput = {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  availableAt?: Date | undefined;
};

export type CreateNotificationOutboxInput = {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  notification: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown> | undefined;
    emailRecipient?: string | null | undefined;
  };
  availableAt?: Date | undefined;
};

export type OutboxEventPayload = Prisma.JsonValue;
