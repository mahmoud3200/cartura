import type { ListPaymentWebhookEventsQuery } from "@cartura/contracts/payments";

import {
  paymentsQueriesRepository,
  type PaymentsQueriesRepository,
} from "./payments.queries.repository.js";
import {
  paymentWebhooksRepository,
  type PaymentWebhooksRepository,
} from "./payments.webhooks.repository.js";

export { PaymentWebhookStateChangedError } from "./payments.webhooks.repository.js";
export type { PaymentWithOrder } from "./payments.persistence.js";

/**
 * Stable facade used by the payment service. Read models and webhook workflow
 * persistence live in separate collaborators so each file has one reason to
 * change without spreading that detail into the service layer.
 */
export class PaymentsRepository {
  constructor(
    private readonly queries: PaymentsQueriesRepository = paymentsQueriesRepository,
    private readonly webhooks: PaymentWebhooksRepository = paymentWebhooksRepository,
  ) {}

  getForUser(userId: string, paymentId: string) {
    return this.queries.getForUser(userId, paymentId);
  }

  listWebhookEvents(query: ListPaymentWebhookEventsQuery) {
    return this.queries.listWebhookEvents(query);
  }

  getWebhookEvent(eventId: string) {
    return this.queries.getWebhookEvent(eventId);
  }

  findPaymobPayment(paymobOrderId: number | null, merchantOrderId: string) {
    return this.queries.findPaymobPayment(paymobOrderId, merchantOrderId);
  }

  upsertWebhookEvent(
    ...args: Parameters<PaymentWebhooksRepository["upsertWebhookEvent"]>
  ) {
    return this.webhooks.upsertWebhookEvent(...args);
  }

  claimWebhookEvent(
    ...args: Parameters<PaymentWebhooksRepository["claimWebhookEvent"]>
  ) {
    return this.webhooks.claimWebhookEvent(...args);
  }

  releaseWebhookClaim(
    ...args: Parameters<PaymentWebhooksRepository["releaseWebhookClaim"]>
  ) {
    return this.webhooks.releaseWebhookClaim(...args);
  }

  finishWebhookEvent(
    ...args: Parameters<PaymentWebhooksRepository["finishWebhookEvent"]>
  ) {
    return this.webhooks.finishWebhookEvent(...args);
  }

  markWebhookForManualReview(
    ...args: Parameters<PaymentWebhooksRepository["markWebhookForManualReview"]>
  ) {
    return this.webhooks.markWebhookForManualReview(...args);
  }

  applyWebhookResult(
    ...args: Parameters<PaymentWebhooksRepository["applyWebhookResult"]>
  ) {
    return this.webhooks.applyWebhookResult(...args);
  }
}

export const paymentsRepository = new PaymentsRepository();
