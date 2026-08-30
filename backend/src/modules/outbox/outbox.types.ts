import type { Prisma } from "../../generated/prisma/client.js";

export type CreateOutboxEventInput = {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  availableAt?: Date | undefined;
};

export type OutboxEventPayload = Prisma.JsonValue;
