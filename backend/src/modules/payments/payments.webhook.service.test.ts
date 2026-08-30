import assert from "node:assert/strict";
import test from "node:test";

import type { PaymentsRepository } from "./payments.repository.js";
import { PaymobWebhookService } from "./payments.webhook.service.js";

test("a webhook worker that loses the claim reports processing without mutation", async () => {
  const payload = { obj: { id: 42, success: false, pending: true } };
  let persistedPayload: unknown;
  let lifecycleMutations = 0;
  const repository = {
    findPaymobPayment: async () => null,
    upsertWebhookEvent: async (input: { payload: unknown }) => {
      persistedPayload = input.payload;
      return { id: "event-1", processedAt: null };
    },
    claimWebhookEvent: async () => false,
    getWebhookEvent: async () => ({ id: "event-1", processedAt: null }),
    applyWebhookResult: async () => {
      lifecycleMutations += 1;
    },
  } as unknown as PaymentsRepository;
  const processor = new PaymobWebhookService(
    repository,
    { verifyTransactionHmac: () => undefined } as never,
    {} as never,
  );

  const result = await processor.process(payload, { skipHmac: true });

  assert.equal(persistedPayload, payload);
  assert.deepEqual(result, { outcome: "processing", matched: false });
  assert.equal(lifecycleMutations, 0);
});
