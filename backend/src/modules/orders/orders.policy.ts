import { conflictError } from "../../shared/errors/index.js";

const allowedOrderTransitions = new Map<string, ReadonlySet<string>>([
  [
    "pending",
    new Set(["paid", "payment_failed", "processing", "cancelled"]),
  ],
  ["confirmed", new Set(["processing", "cancelled"])],
  ["cancelled", new Set()],
  ["payment_failed", new Set(["cancelled"])],
  ["paid", new Set(["processing", "cancelled", "partially_refunded", "refunded"])],
  ["processing", new Set(["shipped", "cancelled"])],
  ["shipped", new Set(["completed"])],
  ["completed", new Set(["partially_refunded", "refunded"])],
  ["partially_refunded", new Set(["refunded"])],
  ["refunded", new Set()],
]);

export function assertOrderTransition(
  previousStatus: string,
  nextStatus: string,
): void {
  if (!allowedOrderTransitions.get(previousStatus)?.has(nextStatus)) {
    throw conflictError(
      "ORDER_STATUS_TRANSITION_INVALID",
      `Cannot change order status from ${previousStatus} to ${nextStatus}`,
    );
  }
}

export function isCashOnDelivery(paymentMethod: string): boolean {
  return paymentMethod === "cash_on_delivery";
}

export function getInitialOrderStatus(
  paymentMethod: string,
): "confirmed" | "pending" {
  return isCashOnDelivery(paymentMethod) ? "confirmed" : "pending";
}

export function assertOrderCancellationAllowed(input: {
  paymentMethod: string | undefined;
  paymentStatus: string | undefined;
}): void {
  if (
    input.paymentStatus === "paid" &&
    !isCashOnDelivery(input.paymentMethod ?? "")
  ) {
    throw conflictError(
      "PAID_ORDER_REQUIRES_REFUND",
      "A paid online order must be refunded instead of cancelled",
    );
  }
}

export function assertOrderFulfillmentAllowed(input: {
  nextStatus: string;
  paymentMethod: string | undefined;
  paymentStatus: string | undefined;
}): void {
  const isFulfillmentStatus = ["processing", "shipped", "completed"].includes(
    input.nextStatus,
  );

  if (
    isFulfillmentStatus &&
    !isCashOnDelivery(input.paymentMethod ?? "") &&
    input.paymentStatus !== "paid"
  ) {
    throw conflictError(
      "ORDER_PAYMENT_REQUIRED",
      "An online payment must be paid before the order enters fulfillment",
    );
  }
}

export function shouldRestoreStockOnCancellation(input: {
  previousOrderStatus: string;
  paymentStatus: string | undefined;
}): boolean {
  return (
    ["pending", "confirmed", "paid", "processing"].includes(
      input.previousOrderStatus,
    ) &&
    !["refunded", "partially_refunded"].includes(input.paymentStatus ?? "")
  );
}
