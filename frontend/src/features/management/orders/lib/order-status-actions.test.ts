import { describe, expect, it } from "vitest";

import { getNextOrderStatuses } from "./order-status-actions";

describe("getNextOrderStatuses", () => {
  it("allows a confirmed cash order to enter processing before collection", () => {
    expect(
      getNextOrderStatuses({
        status: "confirmed",
        payment: {
          paymentMethod: "cash_on_delivery",
          status: "pending",
        },
      }),
    ).toEqual(["processing", "cancelled"]);
  });

  it("keeps a confirmed card order blocked until payment succeeds", () => {
    expect(
      getNextOrderStatuses({
        status: "confirmed",
        payment: { paymentMethod: "card", status: "pending" },
      }),
    ).toEqual([]);

    expect(
      getNextOrderStatuses({
        status: "confirmed",
        payment: { paymentMethod: "card", status: "paid" },
      }),
    ).toEqual(["processing"]);
  });
});
