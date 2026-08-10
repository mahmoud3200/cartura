import {
  refundMethodSchema,
  refundReasonSchema,
  refundResolutionSchema,
  refundStatusSchema,
  type Refund as RefundResponse,
} from "@cartura/contracts/refunds";

import { getRefundEligibilityDeadline } from "./refunds.policy.js";
import type { RefundWithDetails } from "./refunds.repository.js";

export function mapRefund(refund: RefundWithDetails): RefundResponse {
  const order = refund.payment.order;

  return {
    id: refund.id,
    paymentId: refund.paymentId,
    initiatedBy: refund.initiatedBy,
    reviewedBy: refund.reviewedBy,
    providerRefundId: refund.providerRefundId,
    amount: Number(refund.amount),
    currency: refund.currency,
    status: refundStatusSchema.parse(refund.status),
    reasonCode: refund.reasonCode
      ? refundReasonSchema.parse(refund.reasonCode)
      : null,
    customerNote: refund.reason,
    reviewNote: refund.reviewNote,
    resolution: refund.resolution
      ? refundResolutionSchema.parse(refund.resolution)
      : null,
    refundMethod: refundMethodSchema.parse(refund.refundMethod),
    failureReason: refund.failureReason,
    eligibilityExpiresAt: getRefundEligibilityDeadline(
      order.completedAt ?? order.createdAt,
    ).toISOString(),
    pickupScheduledAt: refund.pickupScheduledAt?.toISOString() ?? null,
    itemReceivedAt: refund.itemReceivedAt?.toISOString() ?? null,
    reviewedAt: refund.reviewedAt?.toISOString() ?? null,
    createdAt: refund.createdAt.toISOString(),
    updatedAt: refund.updatedAt.toISOString(),
    completedAt: refund.completedAt?.toISOString() ?? null,
    failedAt: refund.failedAt?.toISOString() ?? null,
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      completedAt: order.completedAt?.toISOString() ?? null,
      address: order.address,
    },
    customer: order.user,
    payment: {
      method: refund.payment.paymentMethod,
      status: refund.payment.status,
    },
  };
}
