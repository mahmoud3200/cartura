import assert from "node:assert/strict";
import test from "node:test";

import {
  listNotificationsQuerySchema,
  notificationIdParamsSchema,
} from "@cartura/contracts/notifications";
import {
  listOrdersQuerySchema,
  orderIdParamsSchema,
  updateOrderStatusRequestSchema,
} from "@cartura/contracts/orders";
import {
  listPaymentWebhookEventsQuerySchema,
  reprocessPaymentWebhookResponseSchema,
} from "@cartura/contracts/payments";
import {
  customerRefundSchema,
  listRefundsQuerySchema,
  reviewRefundRequestSchema,
} from "@cartura/contracts/refunds";

const UUID = "018f47a1-9c2b-7abc-8def-0123456789ab";

test("fulfillment list contracts compose pagination and filters strictly", () => {
  assert.deepEqual(
    listNotificationsQuerySchema.parse({
      page: "2",
      pageSize: "5",
      unreadOnly: "false",
    }),
    { page: 2, limit: 5, unreadOnly: false },
  );
  assert.deepEqual(
    listOrdersQuerySchema.parse({ page: "3", limit: "7", status: "paid" }),
    { page: 3, limit: 7, status: "paid" },
  );
  assert.deepEqual(
    listPaymentWebhookEventsQuerySchema.parse({
      page: "1",
      status: "processing",
    }),
    { page: 1, limit: 20, status: "processing" },
  );
  assert.deepEqual(
    listRefundsQuerySchema.parse({ page: "1", orderId: UUID }),
    { page: 1, limit: 20, orderId: UUID },
  );

  assert.equal(
    listOrdersQuerySchema.safeParse({ page: 1, surprise: true }).success,
    false,
  );
});

test("fulfillment mutation and parameter objects reject unknown keys", () => {
  assert.equal(
    orderIdParamsSchema.safeParse({ orderId: UUID, extra: "value" }).success,
    false,
  );
  assert.equal(
    notificationIdParamsSchema.safeParse({ notificationId: UUID }).success,
    true,
  );
  assert.equal(
    updateOrderStatusRequestSchema.safeParse({
      status: "processing",
      injected: true,
    }).success,
    false,
  );
  assert.equal(
    reviewRefundRequestSchema.safeParse({
      decision: "approve",
      resolution: "keep_item",
      pickupScheduledAt: new Date().toISOString(),
    }).success,
    false,
  );
});

test("payment webhook results use an unambiguous outcome discriminant", () => {
  const outcomes = [
    { outcome: "unmatched" },
    { outcome: "duplicate", matched: false },
    { outcome: "processing", matched: true },
    { outcome: "manual_review" },
    { outcome: "refund_completed" },
    { outcome: "payment_updated" },
  ];

  for (const outcome of outcomes) {
    assert.equal(reprocessPaymentWebhookResponseSchema.safeParse(outcome).success, true);
  }
  assert.equal(
    reprocessPaymentWebhookResponseSchema.safeParse({ matched: true }).success,
    false,
  );
  assert.equal(
    reprocessPaymentWebhookResponseSchema.safeParse({
      outcome: "payment_updated",
      matched: true,
    }).success,
    false,
  );
});

test("customer refunds strip management-only execution evidence", () => {
  const parsed = customerRefundSchema.parse({
    id: UUID,
    paymentId: UUID,
    amount: 100,
    currency: "EGP",
    status: "processing",
    reasonCode: "defective",
    customerNote: null,
    reviewNote: null,
    resolution: "keep_item",
    refundMethod: "card",
    eligibilityExpiresAt: new Date().toISOString(),
    pickupScheduledAt: null,
    itemReceivedAt: null,
    reviewedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    failedAt: null,
    order: {
      id: UUID,
      orderNumber: "ORD-1",
      status: "completed",
      completedAt: new Date().toISOString(),
      address: null,
    },
    customer: { id: UUID, name: "Customer", email: "c@example.com" },
    payment: { method: "card", status: "paid" },
    providerRefundId: "provider-secret",
    failureReason: "raw provider response",
    reviewedBy: UUID,
  });

  assert.equal("providerRefundId" in parsed, false);
  assert.equal("failureReason" in parsed, false);
  assert.equal("reviewedBy" in parsed, false);
});
