import assert from "node:assert/strict";
import test from "node:test";

import {
  canExecuteRefund,
  countsTowardRefundedAmount,
  createCashRefundResult,
  getRefundEligibilityDeadline,
  getRefundMethod,
  isReturnRequestWithinEligibilityWindow,
  isWithinRefundWindow,
  requiresProviderTransaction,
} from "./refunds.policy.js";

test("rejected requests do not consume the refundable balance", () => {
  assert.equal(countsTowardRefundedAmount("rejected"), false);
  assert.equal(countsTowardRefundedAmount("requested"), true);
  assert.equal(countsTowardRefundedAmount("completed"), true);
});

test("the return window lasts fourteen days from completed delivery", () => {
  const completedAt = new Date("2026-07-01T10:00:00.000Z");

  assert.equal(
    getRefundEligibilityDeadline(completedAt).toISOString(),
    "2026-07-15T10:00:00.000Z",
  );
  assert.equal(
    isWithinRefundWindow(completedAt, new Date("2026-07-15T10:00:00.000Z")),
    true,
  );
  assert.equal(
    isWithinRefundWindow(completedAt, new Date("2026-07-15T10:00:00.001Z")),
    false,
  );
});

test("a rejection opens a fresh fourteen-day request window", () => {
  const input = {
    completedAt: new Date("2026-07-01T10:00:00.000Z"),
    latestRejectedAt: new Date("2026-08-01T10:00:00.000Z"),
  };

  assert.equal(
    isReturnRequestWithinEligibilityWindow(
      input,
      new Date("2026-08-15T10:00:00.000Z"),
    ),
    true,
  );
  assert.equal(
    isReturnRequestWithinEligibilityWindow(
      input,
      new Date("2026-08-15T10:00:00.001Z"),
    ),
    false,
  );
});

test("refunds return money through the original payment channel", () => {
  assert.equal(getRefundMethod("cash_on_delivery"), "cash");
  assert.equal(getRefundMethod("card"), "card");
  assert.equal(requiresProviderTransaction("cash"), false);
  assert.equal(requiresProviderTransaction("card"), true);
  assert.deepEqual(createCashRefundResult("refund-1"), {
    success: true,
    pending: false,
    id: "cash:refund-1",
  });
});

test("pickup refunds wait for the item while keep-item refunds do not", () => {
  assert.equal(
    canExecuteRefund({ status: "approved", resolution: "keep_item" }),
    true,
  );
  assert.equal(
    canExecuteRefund({ status: "pickup_scheduled", resolution: "pickup" }),
    false,
  );
  assert.equal(
    canExecuteRefund({ status: "item_received", resolution: "pickup" }),
    true,
  );
});
