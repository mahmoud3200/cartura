import { randomUUID } from "node:crypto";

import type { ReprocessPaymentWebhookResponse } from "@cartura/contracts/payments";
import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
} from "@cartura/contracts/audit-logs";

import { paymobClient } from "../../infrastructure/payments/paymob.client.js";
import { httpError } from "../../shared/errors/index.js";
import { refundsService } from "../refunds/refunds.service.js";
import type { RefundsService } from "../refunds/refunds.service.js";
import {
  paymentsRepository,
  PaymentWebhookStateChangedError,
  type PaymentsRepository,
} from "./payments.repository.js";
import {
  createPaymobEventId,
  decidePaymobLifecycle,
  validatePaymobTransaction,
} from "./payments.paymob.js";

const PAYMENT_WEBHOOK_CLAIM_TIMEOUT_MS = 5 * 60_000;

export type ProcessPaymobWebhookOptions = {
  hmac?: string | undefined;
  skipHmac?: boolean | undefined;
  force?: boolean | undefined;
  stateRetry?: number | undefined;
};

/** Owns Paymob callback validation, claiming, and atomic lifecycle dispatch. */
export class PaymobWebhookService {
  constructor(
    private readonly repository: PaymentsRepository = paymentsRepository,
    private readonly provider: Pick<typeof paymobClient, "verifyTransactionHmac"> = paymobClient,
    private readonly refundWorkflow: Pick<
      RefundsService,
      "findProcessingPaymobRefund" | "completePaymobRefundCallback"
    > = refundsService,
  ) {}

  async process(
    payload: unknown,
    options: ProcessPaymobWebhookOptions = {},
  ): Promise<ReprocessPaymentWebhookResponse> {
    if (!options.skipHmac) {
      this.provider.verifyTransactionHmac(payload, options.hmac);
    }

    const data = getCallbackObject(payload);
    const transactionId = stringify(data.id);

    if (!transactionId) {
      throw httpError(
        400,
        "PAYMOB_TRANSACTION_ID_MISSING",
        "Paymob callback is missing the transaction ID",
      );
    }

    const paymobOrderId = numberOrNull(getNestedValue(data, "order.id"));
    const merchantOrderId =
      stringify(getNestedValue(data, "order.merchant_order_id")) ||
      stringify(data.merchant_order_id) ||
      stringify(data.special_reference);
    const success = booleanValue(data.success);
    const pending = booleanValue(data.pending);
    const isRefunded = booleanValue(data.is_refunded);
    const isVoided = booleanValue(data.is_voided);
    const providerEventId = createPaymobEventId({
      transactionId,
      success,
      pending,
      isRefunded,
      isVoided,
    });
    const failureReason =
      stringify(getNestedValue(data, "data.message")) ||
      stringify(data.txn_response_code) ||
      null;
    let payment = await this.repository.findPaymobPayment(
      paymobOrderId,
      merchantOrderId,
    );
    const event = await this.repository.upsertWebhookEvent({
      providerEventId,
      paymentId: payment?.id ?? null,
      payload,
    });

    if (event.processedAt && !options.force) {
      return { outcome: "duplicate", matched: !!payment };
    }

    const claimToken = randomUUID();
    const claimedAt = new Date();
    const claimed = await this.repository.claimWebhookEvent({
      eventId: event.id,
      claimToken,
      claimedAt,
      staleBefore: new Date(
        claimedAt.getTime() - PAYMENT_WEBHOOK_CLAIM_TIMEOUT_MS,
      ),
      force: options.force ?? false,
    });

    if (!claimed) {
      const latest = await this.repository.getWebhookEvent(event.id);
      return latest?.processedAt
        ? { outcome: "duplicate", matched: !!payment }
        : { outcome: "processing", matched: !!payment };
    }

    payment = await this.repository.findPaymobPayment(
      paymobOrderId,
      merchantOrderId,
    );

    if (!payment) {
      await this.repository.finishWebhookEvent({
        eventId: event.id,
        claimToken,
        status: "failed",
        processedAt: null,
        failureReason: "No matching Cartura payment found",
      });

      return { outcome: "unmatched" };
    }

    if (isRefunded) {
      const refund = await this.refundWorkflow.findProcessingPaymobRefund(
        payment.id,
      );

      if (!refund) {
        await this.markForManualReview({
          eventId: event.id,
          claimToken,
          paymentId: payment.id,
          orderId: payment.orderId,
          orderStatus: payment.order.status,
          providerEventId,
          reason: "No processing card refund matches this callback",
        });
        return { outcome: "manual_review" };
      }

      const refundMismatch = validatePaymobTransaction({
        callbackAmountCents: numberOrNull(data.amount_cents),
        expectedAmountCents: Math.round(Number(refund.amount) * 100),
        callbackCurrency: stringify(data.currency),
        expectedCurrency: refund.currency,
        callbackIntegrationId: numberOrNull(data.integration_id),
        expectedIntegrationId: numberOrNull(
          getNestedValue(asRecord(payment.metadata), "integrationId"),
        ),
      });

      if (refundMismatch) {
        await this.markForManualReview({
          eventId: event.id,
          claimToken,
          paymentId: payment.id,
          orderId: payment.orderId,
          orderStatus: payment.order.status,
          providerEventId,
          reason: refundMismatch,
        });
        return { outcome: "manual_review" };
      }

      await this.refundWorkflow.completePaymobRefundCallback(
        refund,
        transactionId,
        { eventId: event.id, claimToken },
      );

      return { outcome: "refund_completed" };
    }

    const transactionMismatch = validatePaymobTransaction({
      callbackAmountCents: numberOrNull(data.amount_cents),
      expectedAmountCents: Math.round(Number(payment.amount) * 100),
      callbackCurrency: stringify(data.currency),
      expectedCurrency: payment.currency,
      callbackIntegrationId: numberOrNull(data.integration_id),
      expectedIntegrationId: numberOrNull(
        getNestedValue(asRecord(payment.metadata), "integrationId"),
      ),
    });

    if (transactionMismatch) {
      await this.markForManualReview({
        eventId: event.id,
        claimToken,
        paymentId: payment.id,
        orderId: payment.orderId,
        orderStatus: payment.order.status,
        providerEventId,
        reason: transactionMismatch,
      });

      return { outcome: "manual_review" };
    }

    const lifecycle = decidePaymobLifecycle({
      currentPaymentStatus: payment.status,
      currentOrderStatus: payment.order.status,
      success,
      pending,
      isRefunded,
      isVoided,
    });

    if (lifecycle.kind === "manual_review") {
      await this.markForManualReview({
        eventId: event.id,
        claimToken,
        paymentId: payment.id,
        orderId: payment.orderId,
        orderStatus: payment.order.status,
        providerEventId,
        reason: lifecycle.reason,
      });

      return { outcome: "manual_review" };
    }

    try {
      await this.repository.applyWebhookResult({
        payment,
        eventId: event.id,
        claimToken,
        providerEventId,
        transactionId,
        paymobOrderId,
        merchantOrderId,
        success,
        pending,
        failureReason,
        nextPaymentStatus: lifecycle.nextPaymentStatus,
        nextOrderStatus: lifecycle.nextOrderStatus,
      });
    } catch (error) {
      if (!(error instanceof PaymentWebhookStateChangedError)) throw error;

      await this.repository.releaseWebhookClaim(event.id, claimToken);
      if ((options.stateRetry ?? 0) >= 1) {
        return { outcome: "processing", matched: true };
      }

      return this.process(payload, {
        ...options,
        skipHmac: true,
        stateRetry: (options.stateRetry ?? 0) + 1,
      });
    }

    return { outcome: "payment_updated" };
  }

  private async markForManualReview(input: {
    eventId: string;
    claimToken: string;
    paymentId: string;
    orderId: string;
    orderStatus: string;
    providerEventId: string;
    reason: string;
  }) {
    await this.repository.markWebhookForManualReview({
      eventId: input.eventId,
      claimToken: input.claimToken,
      paymentId: input.paymentId,
      reason: input.reason,
      audit: {
        actorType: "system",
        action: AUDIT_ACTIONS.PAYMENT_WEBHOOK_MANUAL_REVIEW,
        resourceType: AUDIT_RESOURCE_TYPES.PAYMENT_WEBHOOK_EVENT,
        resourceId: input.eventId,
        metadata: {
          paymentId: input.paymentId,
          orderId: input.orderId,
          orderStatus: input.orderStatus,
          providerEventId: input.providerEventId,
          reason: input.reason,
        },
      },
    });
  }
}

function getCallbackObject(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }

  const record = payload as Record<string, unknown>;
  const obj = record.obj;

  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    return obj as Record<string, unknown>;
  }

  return record;
}

function getNestedValue(data: Record<string, unknown>, key: string): unknown {
  return key.split(".").reduce<unknown>((current, path) => {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }

    return (current as Record<string, unknown>)[path];
  }, data);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringify(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

function numberOrNull(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function booleanValue(value: unknown): boolean {
  return value === true || value === "true";
}

export const paymobWebhookService = new PaymobWebhookService();
