import assert from "node:assert/strict";
import test from "node:test";

import type { PaymobClient } from "../../infrastructure/payments/paymob.client.js";
import {
  retryRefundSerializableTransaction,
  type RefundsRepository,
} from "./refunds.repository.js";
import { RefundsService } from "./refunds.service.js";

test("serializable refund work retries P2034 conflicts with a bound", async () => {
  let attempts = 0;
  const result = await retryRefundSerializableTransaction(
    async () => {
      attempts += 1;
      if (attempts < 3) {
        throw Object.assign(new Error("write conflict"), { code: "P2034" });
      }
      return "completed";
    },
    "completion_concurrent",
  );

  assert.equal(result, "completed");
  assert.equal(attempts, 3);
});

test("provider success followed by local failure records manual uncertainty", async () => {
  const approved = {
    id: "refund-1",
    status: "approved",
    resolution: "keep_item",
    refundMethod: "card",
    amount: 100,
    payment: { providerTransactionId: "transaction-1" },
  };
  const processing = { ...approved, status: "processing" };
  let uncertaintyReason = "";
  const repository = {
    findById: async () => approved,
    markProcessing: async () => processing,
    complete: async () => {
      throw new Error("database timeout");
    },
    recordExecutionUncertainty: async (_refund: unknown, reason: string) => {
      uncertaintyReason = reason;
      return { ...processing, failureReason: reason };
    },
  } as unknown as RefundsRepository;
  const provider = {
    refundTransaction: async () => ({
      success: true,
      pending: false,
      id: "provider-refund-1",
    }),
  } as Pick<PaymobClient, "refundTransaction">;

  const result = await new RefundsService(repository, provider).execute(
    approved.id,
  );

  assert.match(uncertaintyReason, /Manual reconciliation is required/);
  assert.equal(result.status, "processing");
});

test("a failed provider refund can be retried", async () => {
  const failed = {
    id: "refund-1",
    status: "failed",
    resolution: "keep_item",
    refundMethod: "card",
    amount: 100,
    payment: { providerTransactionId: "transaction-1" },
  };
  const processing = { ...failed, status: "processing" };
  let providerCalls = 0;
  const repository = {
    findById: async () => failed,
    markProcessing: async () => processing,
    complete: async () => ({ ...processing, status: "completed" }),
  } as unknown as RefundsRepository;
  const provider = {
    refundTransaction: async () => {
      providerCalls += 1;
      return {
        success: true,
        pending: false,
        id: "provider-refund-2",
      };
    },
  } as Pick<PaymobClient, "refundTransaction">;

  const result = await new RefundsService(repository, provider).execute(
    failed.id,
  );

  assert.equal(providerCalls, 1);
  assert.equal(result.status, "completed");
});

test("an explicit provider rejection remains failed for a later retry", async () => {
  const approved = {
    id: "refund-1",
    status: "approved",
    resolution: "keep_item",
    refundMethod: "card",
    amount: 100,
    payment: { providerTransactionId: "transaction-1" },
  };
  const processing = { ...approved, status: "processing" };
  let recordedReason = "";
  const repository = {
    findById: async () => approved,
    markProcessing: async () => processing,
    fail: async (_refund: unknown, reason: string) => {
      recordedReason = reason;
      return { ...processing, status: "failed", failureReason: reason };
    },
  } as unknown as RefundsRepository;
  const provider = {
    refundTransaction: async () => ({
      success: false,
      pending: false,
      message: "Provider rejected the request",
    }),
  } as Pick<PaymobClient, "refundTransaction">;

  const result = await new RefundsService(repository, provider).execute(
    approved.id,
  );

  assert.equal(recordedReason, "Provider rejected the request");
  assert.equal(result.status, "failed");
});
