import type { OrderSummary } from "@cartura/contracts/orders";
import { describe, expect, it } from "vitest";

import { getCheckoutPaymentState } from "./checkout-result";

function checkoutOrder(
  orderStatus: OrderSummary["status"],
  paymentStatus: NonNullable<OrderSummary["payment"]>["status"],
) {
  return {
    status: orderStatus,
    payment: { status: paymentStatus },
  } as OrderSummary;
}

describe("getCheckoutPaymentState", () => {
  it("reports a paid order as confirmed", () => {
    expect(getCheckoutPaymentState(checkoutOrder("confirmed", "paid"))).toBe(
      "paid",
    );
  });

  it.each(["payment_failed", "cancelled"] as const)(
    "reports %s orders as failed",
    (status) => {
      expect(getCheckoutPaymentState(checkoutOrder(status, "failed"))).toBe(
        "failed",
      );
    },
  );

  it("keeps unresolved and missing orders in verification", () => {
    expect(
      getCheckoutPaymentState(checkoutOrder("pending", "pending")),
    ).toBe("verifying");
    expect(getCheckoutPaymentState(null)).toBe("verifying");
  });
});
