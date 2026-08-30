import assert from "node:assert/strict";
import test from "node:test";

import type { NotificationsService } from "../notifications/notifications.service.js";
import type { OutboxRepository } from "./outbox.repository.js";
import { OutboxService } from "./outbox.service.js";
import { getNotificationFromOutboxPayload } from "./outbox.utils.js";

const USER_ID = "018f47a1-9c2b-7abc-8def-0123456789ab";

test("outbox notification payload must match its aggregate event type", () => {
  const event = {
    aggregateType: "order",
    eventType: "order.paid",
    payload: {
      notification: {
        userId: USER_ID,
        type: "order.paid",
        title: "Paid",
        body: "The order was paid.",
      },
    },
  };

  assert.equal(getNotificationFromOutboxPayload(event).type, "order.paid");
  assert.throws(
    () => getNotificationFromOutboxPayload({
      ...event,
      eventType: "refund.completed",
    }),
    /event type does not match/,
  );
  assert.throws(
    () => getNotificationFromOutboxPayload({
      ...event,
      aggregateType: "unknown",
    }),
    /Unsupported notification outbox aggregate/,
  );
});

test("outbox completion uses the acquired token and does not count lost claims", async () => {
  let acquiredToken = "";
  let completionToken = "";
  const event = {
    id: "event-1",
    aggregateType: "payment",
    aggregateId: "payment-1",
    eventType: "payment.paid",
    payload: {
      notification: {
        userId: USER_ID,
        type: "payment.paid",
        title: "Paid",
        body: "Payment succeeded.",
      },
    },
    status: "pending",
    attempts: 0,
    availableAt: new Date(),
    processedAt: null,
    lastError: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const repository = {
    findPending: async () => [event],
    claim: async (input: { claimToken: string }) => {
      acquiredToken = input.claimToken;
      return true;
    },
    markProcessed: async (_eventId: string, claimToken: string) => {
      completionToken = claimToken;
      return false;
    },
    markFailedOrPending: async () => ({ count: 1 }),
  } as unknown as OutboxRepository;
  const notifier = {
    create: async () => ({ id: "notification-1" }),
  } as unknown as NotificationsService;

  const processed = await new OutboxService(repository, notifier).processBatch();

  assert.match(acquiredToken, /^[0-9a-f-]{36}$/);
  assert.equal(completionToken, acquiredToken);
  assert.equal(processed, 0);
});
