import assert from "node:assert/strict";
import test from "node:test";

import {
  createPaymobEventId,
  decidePaymobLifecycle,
  validatePaymobTransaction,
} from "./payments.paymob.js";

test("callback event identity preserves transaction lifecycle changes", () => {
  const callback = {
    transactionId: "812345678",
    success: false,
    isRefunded: false,
    isVoided: false,
  };

  assert.equal(
    createPaymobEventId({ ...callback, pending: true }),
    "812345678:pending",
  );
  assert.equal(
    createPaymobEventId({ ...callback, pending: false, success: true }),
    "812345678:succeeded",
  );
});

test("successful callbacks confirm awaiting payment without regressing fulfillment", () => {
  assert.deepEqual(
    decidePaymobLifecycle({
      currentPaymentStatus: "pending",
      currentOrderStatus: "pending",
      success: true,
      pending: false,
      isRefunded: false,
      isVoided: false,
    }),
    {
      kind: "apply",
      nextPaymentStatus: "paid",
      nextOrderStatus: "confirmed",
    },
  );

  assert.deepEqual(
    decidePaymobLifecycle({
      currentPaymentStatus: "paid",
      currentOrderStatus: "shipped",
      success: true,
      pending: false,
      isRefunded: false,
      isVoided: false,
    }),
    {
      kind: "apply",
      nextPaymentStatus: "paid",
      nextOrderStatus: "shipped",
    },
  );
});

test("late declines and refund callbacks require manual review", () => {
  assert.equal(
    decidePaymobLifecycle({
      currentPaymentStatus: "paid",
      currentOrderStatus: "processing",
      success: false,
      pending: false,
      isRefunded: false,
      isVoided: false,
    }).kind,
    "manual_review",
  );
  assert.equal(
    decidePaymobLifecycle({
      currentPaymentStatus: "paid",
      currentOrderStatus: "completed",
      success: true,
      pending: false,
      isRefunded: true,
      isVoided: false,
    }).kind,
    "manual_review",
  );
});

test("callback amount, currency, and integration must match", () => {
  assert.equal(
    validatePaymobTransaction({
      callbackAmountCents: 12500,
      expectedAmountCents: 12500,
      callbackCurrency: "EGP",
      expectedCurrency: "EGP",
      callbackIntegrationId: 42,
      expectedIntegrationId: 42,
    }),
    null,
  );
  assert.match(
    validatePaymobTransaction({
      callbackAmountCents: 12000,
      expectedAmountCents: 12500,
      callbackCurrency: "EGP",
      expectedCurrency: "EGP",
      callbackIntegrationId: 42,
      expectedIntegrationId: 42,
    }) ?? "",
    /amount/,
  );
});
