import {
  refundMethodSchema,
  refundReasonSchema,
  refundResolutionSchema,
  refundStatusSchema,
  type CustomerRefund,
  type ManagementRefund,
} from "@cartura/contracts/refunds";
import {
  orderCurrencySchema,
  orderStatusSchema,
  paymentMethodSchema,
} from "@cartura/contracts/orders";
import { paymentRecordStatusSchema } from "@cartura/contracts/payments";

import { getReturnRequestEligibilityDeadline } from "./refunds.policy.js";
import type { RefundWithDetails } from "./refunds.repository.js";

export function mapRefund(refund: RefundWithDetails): ManagementRefund {
  const order = refund.payment.order;
  const latestRejectedRefund = refund.payment.refunds.find(
    (candidate) => candidate.status === "rejected",
  );

  return {
    id: refund.id,
    paymentId: refund.paymentId,
    initiatedBy: refund.initiatedBy,
    reviewedBy: refund.reviewedBy,
    providerRefundId: refund.providerRefundId,
    amount: Number(refund.amount),
    currency: orderCurrencySchema.parse(refund.currency),
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
    eligibilityExpiresAt: getReturnRequestEligibilityDeadline({
      completedAt: order.completedAt ?? order.createdAt,
      latestRejectedAt:
        latestRejectedRefund?.reviewedAt ?? latestRejectedRefund?.updatedAt,
    }).toISOString(),
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
      status: orderStatusSchema.parse(order.status),
      completedAt: order.completedAt?.toISOString() ?? null,
      address: order.address
        ? {
            recipientName: order.address.recipientName,
            phoneNumber: order.address.phoneNumber,
            country: order.address.country,
            city: order.address.city,
            area: order.address.area,
            streetAddress: order.address.streetAddress,
            postalCode: order.address.postalCode,
          }
        : null,
    },
    customer: {
      id: order.user.id,
      name: order.user.name,
      email: order.user.email,
    },
    payment: {
      method: paymentMethodSchema.parse(refund.payment.paymentMethod),
      status: paymentRecordStatusSchema.parse(refund.payment.status),
    },
  };
}

export function mapCustomerRefund(refund: RefundWithDetails): CustomerRefund {
  const mapped = mapRefund(refund);

  return {
    id: mapped.id,
    paymentId: mapped.paymentId,
    amount: mapped.amount,
    currency: mapped.currency,
    status: mapped.status,
    reasonCode: mapped.reasonCode,
    customerNote: mapped.customerNote,
    reviewNote: mapped.reviewNote,
    resolution: mapped.resolution,
    refundMethod: mapped.refundMethod,
    eligibilityExpiresAt: mapped.eligibilityExpiresAt,
    pickupScheduledAt: mapped.pickupScheduledAt,
    itemReceivedAt: mapped.itemReceivedAt,
    reviewedAt: mapped.reviewedAt,
    createdAt: mapped.createdAt,
    updatedAt: mapped.updatedAt,
    completedAt: mapped.completedAt,
    failedAt: mapped.failedAt,
    order: mapped.order,
    customer: mapped.customer,
    payment: mapped.payment,
  };
}
