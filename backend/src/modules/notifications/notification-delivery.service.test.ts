import assert from "node:assert/strict";
import test from "node:test";

import type { MailService } from "../../infrastructure/mail/index.js";
import type { NotificationDeliveriesRepository } from "./notification-deliveries.repository.js";
import { NotificationDeliveryService } from "./notification-delivery.service.js";

test("delivery completion is guarded by the token acquired for that row", async () => {
  let claimedToken = "";
  let completionToken = "";
  const repository = {
    findPending: async () => [{
      id: "delivery-1",
      channel: "email",
      recipient: "customer@example.com",
      attempts: 0,
      notification: {
        title: "Update",
        body: "Your order changed.",
      },
    }],
    claim: async (input: { claimToken: string }) => {
      claimedToken = input.claimToken;
      return true;
    },
    markSent: async (_id: string, token: string) => {
      completionToken = token;
      return false;
    },
    recordFailure: async () => true,
  } as unknown as NotificationDeliveriesRepository;
  const mailer = {
    sendMail: async () => ({ messageId: "provider-message-1" }),
  } as unknown as MailService;

  const processed = await new NotificationDeliveryService(
    repository,
    mailer,
  ).processPending();

  assert.match(claimedToken, /^[0-9a-f-]{36}$/);
  assert.equal(completionToken, claimedToken);
  assert.equal(processed, 0);
});
