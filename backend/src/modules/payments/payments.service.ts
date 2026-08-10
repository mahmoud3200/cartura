import type {
  ListPaymentWebhookEventsQuery,
} from "@cartura/contracts/payments";

import { paymobClient } from "../../infrastructure/payments/paymob.client.js";
import {
  conflictError,
  httpError,
  notFoundError,
} from "../../shared/errors/index.js";
import { auditLogsRepository } from "../audit-logs/audit-logs.repository.js";
import { refundsService } from "../refunds/refunds.service.js";
import type { AuditContext } from "../audit-logs/audit-logs.types.js";
import {
  paymentsRepository,
  type PaymentsRepository,
} from "./payments.repository.js";
import {
  createPaymobEventId,
  decidePaymobLifecycle,
  validatePaymobTransaction,
} from "./payments.paymob.js";

export class PaymentsService {
  constructor(
    private readonly repository: PaymentsRepository = paymentsRepository,
  ) {}

  async getForUser(userId: string, paymentId: string) {
    const payment = await this.repository.getForUser(userId, paymentId);

    if (!payment) {
      throw notFoundError("PAYMENT_NOT_FOUND", "Payment not found");
    }

    return payment;
  }

  async handlePaymobWebhook(payload: unknown, hmac?: string) {
    return this.processPaymobWebhook(payload, { hmac });
  }

  async listWebhookEvents(query: ListPaymentWebhookEventsQuery) {
    return this.repository.listWebhookEvents(query);
  }

  async getWebhookEvent(eventId: string) {
    const event = await this.repository.getWebhookEvent(eventId);

    if (!event) {
      throw notFoundError("PAYMENT_WEBHOOK_EVENT_NOT_FOUND", "Webhook event not found");
    }

    return event;
  }

  async reprocessWebhookEvent(eventId: string, audit?: AuditContext) {
    const event = await this.getWebhookEvent(eventId);

    if (event.processedAt) {
      throw conflictError(
        "PAYMENT_WEBHOOK_EVENT_ALREADY_PROCESSED",
        "Webhook event has already been processed",
      );
    }

    const result = await this.processPaymobWebhook(event.payload, {
      skipHmac: true,
      force: true,
    });

    if (audit) {
      await auditLogsRepository.create({
        ...audit,
        action: "payment.webhook.reprocess",
        resourceType: "payment_webhook_event",
        resourceId: event.id,
        metadata: {
          provider: event.provider,
          providerEventId: event.providerEventId,
          result,
        },
      });
    }

    return result;
  }

  private async processPaymobWebhook(
    payload: unknown,
    options: {
      hmac?: string | undefined;
      skipHmac?: boolean | undefined;
      force?: boolean | undefined;
    },
  ) {
    if (!options.skipHmac) {
      paymobClient.verifyTransactionHmac(payload, options.hmac);
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
    const payment = await this.repository.findPaymobPayment(
      paymobOrderId,
      merchantOrderId,
    );
    const event = await this.repository.upsertWebhookEvent({
      providerEventId,
      paymentId: payment?.id ?? null,
      payload,
    });

    if (!payment) {
      await this.repository.updateWebhookEvent(event.id, {
        status: "failed",
        failureReason: "No matching Cartura payment found",
      });

      return { matched: false };
    }

    if (event.processedAt && !options.force) {
      return { matched: true, duplicate: true };
    }

    if (isRefunded) {
      const refund = await refundsService.findProcessingPaymobRefund(payment.id);

      if (!refund) {
        await this.markForManualReview({
          eventId: event.id,
          paymentId: payment.id,
          orderId: payment.orderId,
          orderStatus: payment.order.status,
          providerEventId,
          reason: "No processing card refund matches this callback",
        });
        return { matched: true, manualReview: true };
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
          paymentId: payment.id,
          orderId: payment.orderId,
          orderStatus: payment.order.status,
          providerEventId,
          reason: refundMismatch,
        });
        return { matched: true, manualReview: true };
      }

      await refundsService.completePaymobRefundCallback(refund, transactionId);
      await this.repository.updateWebhookEvent(event.id, {
        status: "processed",
        processedAt: new Date(),
        failureReason: null,
      });

      return { matched: true, refundCompleted: true };
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
        paymentId: payment.id,
        orderId: payment.orderId,
        orderStatus: payment.order.status,
        providerEventId,
        reason: transactionMismatch,
      });

      return { matched: true, manualReview: true };
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
        paymentId: payment.id,
        orderId: payment.orderId,
        orderStatus: payment.order.status,
        providerEventId,
        reason: lifecycle.reason,
      });

      return { matched: true, manualReview: true };
    }

    await this.repository.applyWebhookResult({
      payment,
      eventId: event.id,
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

    return { matched: true };
  }

  private async markForManualReview(input: {
    eventId: string;
    paymentId: string;
    orderId: string;
    orderStatus: string;
    providerEventId: string;
    reason: string;
  }) {
    await this.repository.updateWebhookEvent(input.eventId, {
      payment: { connect: { id: input.paymentId } },
      status: "manual_review",
      failureReason: input.reason,
    });

    await auditLogsRepository.create({
      actorType: "system",
      action: "payment.webhook.manual_review",
      resourceType: "payment_webhook_event",
      resourceId: input.eventId,
      metadata: {
        paymentId: input.paymentId,
        orderId: input.orderId,
        orderStatus: input.orderStatus,
        providerEventId: input.providerEventId,
        reason: input.reason,
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
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function numberOrNull(value: unknown): number | null {
  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function booleanValue(value: unknown): boolean {
  return value === true || value === "true";
}

export const paymentsService = new PaymentsService();
