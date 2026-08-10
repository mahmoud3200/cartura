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

export function getNotificationFromOutboxPayload(
  payload: OutboxEventPayload,
  fallbackType: string,
): CreateNotificationInput | null {
  const record = asRecord(payload);
  const notification = record ? asRecord(record.notification) : null;

  if (!notification) {
    return null;
  }

  const input = {
    userId: stringValue(notification.userId),
    type: stringValue(notification.type || fallbackType),
    title: stringValue(notification.title),
    body: stringValue(notification.body),
    emailRecipient:
      typeof notification.emailRecipient === "string"
        ? notification.emailRecipient
        : null,
  };
  const data = asRecord(notification.data);

  return data
    ? {
        ...input,
        data,
      }
    : input;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}
