import { REFUND_WINDOW_DAYS } from "@cartura/contracts/refunds";

const REFUND_WINDOW_MS = REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export function getRefundEligibilityDeadline(completedAt: Date): Date {
  return new Date(completedAt.getTime() + REFUND_WINDOW_MS);
}

export function isWithinRefundWindow(
  startsAt: Date,
  now = new Date(),
): boolean {
  return now.getTime() <= getRefundEligibilityDeadline(startsAt).getTime();
}

export function isReturnRequestWithinEligibilityWindow(
  input: {
    completedAt: Date;
    latestRejectedAt?: Date | null | undefined;
  },
  now = new Date(),
): boolean {
  return now.getTime() <= getReturnRequestEligibilityDeadline(input).getTime();
}

export function getReturnRequestEligibilityDeadline(input: {
  completedAt: Date;
  latestRejectedAt?: Date | null | undefined;
}): Date {
  const latestEligibilityAnchor = input.latestRejectedAt
    ? new Date(
        Math.max(input.completedAt.getTime(), input.latestRejectedAt.getTime()),
      )
    : input.completedAt;

  return getRefundEligibilityDeadline(latestEligibilityAnchor);
}

export function getRefundMethod(paymentMethod: string): "card" | "cash" {
  return paymentMethod === "cash_on_delivery" ? "cash" : "card";
}

export function requiresProviderTransaction(refundMethod: string): boolean {
  return refundMethod === "card";
}

export function countsTowardRefundedAmount(status: string): boolean {
  return status !== "rejected";
}

export function canExecuteRefund(input: {
  status: string;
  resolution: string | null;
}): boolean {
  return (
    (input.resolution === "keep_item" &&
      ["approved", "failed"].includes(input.status)) ||
    (input.resolution === "pickup" &&
      ["item_received", "failed"].includes(input.status))
  );
}

export function createCashRefundResult(refundId: string) {
  return {
    success: true as const,
    pending: false as const,
    id: `cash:${refundId}`,
  };
}
