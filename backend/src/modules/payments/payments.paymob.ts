export type PaymobLifecycleDecision =
  | {
      kind: "apply";
      nextPaymentStatus: string;
      nextOrderStatus: string;
    }
  | {
      kind: "manual_review";
      reason: string;
    };

export function createPaymobEventId(input: {
  transactionId: string;
  success: boolean;
  pending: boolean;
  isRefunded: boolean;
  isVoided: boolean;
}) {
  const state = input.isRefunded
    ? "refunded"
    : input.isVoided
      ? "voided"
      : input.pending
        ? "pending"
        : input.success
          ? "succeeded"
          : "failed";

  return `${input.transactionId}:${state}`;
}

export function decidePaymobLifecycle(input: {
  currentPaymentStatus: string;
  currentOrderStatus: string;
  success: boolean;
  pending: boolean;
  isRefunded: boolean;
  isVoided: boolean;
}): PaymobLifecycleDecision {
  if (input.isRefunded || input.isVoided) {
    return {
      kind: "manual_review",
      reason:
        "Refund and void callbacks must be reconciled with the refund workflow",
    };
  }

  if (input.pending) {
    return {
      kind: "apply",
      nextPaymentStatus: input.currentPaymentStatus,
      nextOrderStatus: input.currentOrderStatus,
    };
  }

  if (input.success) {
    if (input.currentOrderStatus === "cancelled") {
      return {
        kind: "manual_review",
        reason: "Paid webhook arrived after order was cancelled",
      };
    }

    return {
      kind: "apply",
      nextPaymentStatus: "paid",
      nextOrderStatus: ["pending", "payment_failed"].includes(
        input.currentOrderStatus,
      )
        ? "confirmed"
        : input.currentOrderStatus,
    };
  }

  if (
    input.currentPaymentStatus === "paid" ||
    !["pending", "payment_failed"].includes(input.currentOrderStatus)
  ) {
    return {
      kind: "manual_review",
      reason: "Declined webhook would regress a paid or fulfilled order",
    };
  }

  return {
    kind: "apply",
    nextPaymentStatus: "failed",
    nextOrderStatus: "cancelled",
  };
}

export function validatePaymobTransaction(input: {
  callbackAmountCents: number | null;
  expectedAmountCents: number;
  callbackCurrency: string;
  expectedCurrency: string;
  callbackIntegrationId: number | null;
  expectedIntegrationId: number | null;
}) {
  if (
    input.callbackAmountCents === null ||
    input.callbackAmountCents !== input.expectedAmountCents
  ) {
    return "Callback amount does not match the payment";
  }

  if (
    !input.callbackCurrency ||
    input.callbackCurrency.toUpperCase() !== input.expectedCurrency.toUpperCase()
  ) {
    return "Callback currency does not match the payment";
  }

  if (
    input.expectedIntegrationId !== null &&
    input.callbackIntegrationId !== input.expectedIntegrationId
  ) {
    return "Callback integration does not match the payment";
  }

  return null;
}
