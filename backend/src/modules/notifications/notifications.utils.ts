export const MAX_DELIVERY_ATTEMPTS = 8;
export const DELIVERY_CLAIM_TIMEOUT_MS = 5 * 60_000;

export function nextDeliveryAttemptAt(attempts: number, now: Date): Date {
  const delayMs = Math.min(10 * 60_000, 2 ** Math.max(0, attempts - 1) * 5000);

  return new Date(now.getTime() + delayMs);
}

export function getDeliveryErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown delivery error";
}
