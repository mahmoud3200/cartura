import {
  paymentWebhookEventStatusSchema,
  paymentProviderSchema,
  paymentRecordProviderSchema,
  paymentRecordStatusSchema,
  type Payment as PaymentResponse,
  type PaymentWebhookEvent as PaymentWebhookEventResponse,
} from "@cartura/contracts/payments";

import type { PaymentWithOrder } from "./payments.repository.js";
import type { PaymentWebhookEvent } from "../../generated/prisma/client.js";

export function mapPayment(payment: PaymentWithOrder): PaymentResponse {
  return {
    id: payment.id,
    orderId: payment.orderId,
    provider: paymentRecordProviderSchema.parse(payment.provider),
    providerTransactionId: payment.providerTransactionId,
    paymentMethod: payment.paymentMethod,
    status: paymentRecordStatusSchema.parse(payment.status),
    amount: Number(payment.amount),
    currency: payment.currency,
    failureReason: payment.failureReason,
    paidAt: payment.paidAt?.toISOString() ?? null,
    refundedAt: payment.refundedAt?.toISOString() ?? null,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    order: {
      id: payment.order.id,
      orderNumber: payment.order.orderNumber,
      status: payment.order.status,
      userId: payment.order.userId,
    },
    refunds: payment.refunds.map((refund) => ({
      id: refund.id,
      amount: Number(refund.amount),
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
      createdAt: refund.createdAt.toISOString(),
      updatedAt: refund.updatedAt.toISOString(),
      completedAt: refund.completedAt?.toISOString() ?? null,
      failedAt: refund.failedAt?.toISOString() ?? null,
    })),
  };
}

export function mapPaymentWebhookEvent(
  event: PaymentWebhookEvent,
): PaymentWebhookEventResponse {
  return {
    id: event.id,
    paymentId: event.paymentId,
    provider: paymentProviderSchema.parse(event.provider),
    providerEventId: event.providerEventId,
    eventType: event.eventType,
    status: paymentWebhookEventStatusSchema.parse(event.status),
    attempts: event.attempts,
    payload: event.payload,
    failureReason: event.failureReason,
    receivedAt: event.receivedAt.toISOString(),
    processedAt: event.processedAt?.toISOString() ?? null,
  };
}
