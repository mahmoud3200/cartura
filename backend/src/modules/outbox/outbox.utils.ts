import { z } from "zod";

import type { CreateNotificationInput } from "../notifications/index.js";
import type { OutboxEventPayload } from "./outbox.types.js";

export const OUTBOX_MAX_ATTEMPTS = 8;
export const OUTBOX_CLAIM_TIMEOUT_MS = 5 * 60_000;

export function nextOutboxAttemptAt(attempts: number): Date {
  const delayMs = Math.min(60_000, 2 ** Math.max(0, attempts - 1) * 1000);

  return new Date(Date.now() + delayMs);
}

export function getOutboxErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown outbox error";
}

const notificationPayloadSchema = z.object({
  notification: z.object({
    userId: z.uuid(),
    type: z.string().trim().min(1),
    title: z.string().trim().min(1),
    body: z.string().trim().min(1),
    data: z.record(z.string(), z.unknown()).optional(),
    emailRecipient: z.email().nullable().optional(),
  }),
});

export function getNotificationFromOutboxPayload(
  event: {
    aggregateType: string;
    eventType: string;
    payload: OutboxEventPayload;
  },
): CreateNotificationInput {
  const parsed = notificationPayloadSchema.safeParse(event.payload);

  if (!parsed.success) {
    throw new Error("Invalid notification outbox payload");
  }

  if (!isSupportedNotificationAggregate(event.aggregateType)) {
    throw new Error("Unsupported notification outbox aggregate type");
  }

  if (
    !event.eventType.startsWith(`${event.aggregateType}.`) ||
    parsed.data.notification.type !== event.eventType
  ) {
    throw new Error("Notification outbox event type does not match its payload");
  }

  const notification = parsed.data.notification;

  return {
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    ...(notification.data ? { data: notification.data } : {}),
    ...(notification.emailRecipient !== undefined
      ? { emailRecipient: notification.emailRecipient }
      : {}),
  };
}

function isSupportedNotificationAggregate(
  aggregateType: string,
): aggregateType is "order" | "payment" | "refund" {
  return ["order", "payment", "refund"].includes(aggregateType);
}
