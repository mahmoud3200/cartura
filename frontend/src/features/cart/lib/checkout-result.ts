import type { OrderSummary } from "@cartura/contracts/orders";

export type CheckoutPaymentState = "paid" | "failed" | "verifying";

export function getCheckoutPaymentState(
  order: OrderSummary | null,
): CheckoutPaymentState {
  if (order?.payment?.status === "paid") {
    return "paid";
  }

  if (
    order?.payment?.status === "failed" ||
    order?.status === "payment_failed" ||
    order?.status === "cancelled"
  ) {
    return "failed";
  }

  return "verifying";
}
