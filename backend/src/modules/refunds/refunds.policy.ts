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
  return (
    isWithinRefundWindow(input.completedAt, now) ||
    (input.latestRejectedAt
      ? isWithinRefundWindow(input.latestRejectedAt, now)
      : false)
  );
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
    (input.resolution === "keep_item" && input.status === "approved") ||
    (input.resolution === "pickup" && input.status === "item_received")
  );
}

export function createCashRefundResult(refundId: string) {
  return {
    success: true as const,
    pending: false as const,
    id: `cash:${refundId}`,
  };
}
