import assert from "node:assert/strict";
import test from "node:test";

import {
  buyNowCheckoutRequestSchema,
  checkoutOrderRequestSchema,
} from "@cartura/contracts/orders";

import {
  getInitialOrderStatus,
  isCashOnDelivery,
} from "./orders.policy.js";

test("cash on delivery orders are confirmed at creation", () => {
  assert.equal(isCashOnDelivery("cash_on_delivery"), true);
  assert.equal(getInitialOrderStatus("cash_on_delivery"), "confirmed");
});

test("card orders remain pending until the signed payment callback", () => {
  assert.equal(isCashOnDelivery("card"), false);
  assert.equal(getInitialOrderStatus("card"), "pending");
});

test("checkout requests require a client idempotency key", () => {
  const addressId = "019fe859-331d-75b7-af23-55fd23031c13";

  assert.equal(
    checkoutOrderRequestSchema.safeParse({ addressId }).success,
    false,
  );
  assert.equal(
    buyNowCheckoutRequestSchema.safeParse({
      addressId,
      productId: "019fe85d-9565-7510-bdea-082b0724bc1e",
    }).success,
    false,
  );
});
