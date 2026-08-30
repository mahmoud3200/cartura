import type { RefundStatus } from "@cartura/contracts/refunds";

import type { CreateOutboxEventInput } from "../outbox/index.js";

export function createRefundNotificationOutboxEvent(input: {
  refundId: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  email: string;
  status: RefundStatus;
  pickupScheduledAt?: Date | null;
}): CreateOutboxEventInput {
  const content = getRefundNotificationContent(input);

  return {
    aggregateType: "refund",
    aggregateId: input.refundId,
    eventType: `refund.${input.status}`,
    payload: {
      notification: {
        userId: input.userId,
        type: `refund.${input.status}`,
        title: content.title,
        body: content.body,
        data: {
          refundId: input.refundId,
          orderId: input.orderId,
          orderNumber: input.orderNumber,
          status: input.status,
          pickupScheduledAt:
            input.pickupScheduledAt?.toISOString() ?? null,
        },
        emailRecipient: input.email,
      },
    },
  };
}

function getRefundNotificationContent(input: {
  orderNumber: string;
  status: RefundStatus;
  pickupScheduledAt?: Date | null;
}) {
  switch (input.status) {
    case "requested":
      return {
        title: "Return request received",
        body: `We received your return request for order ${input.orderNumber}.`,
      };
    case "approved":
      return {
        title: "Return approved",
        body: `Your return for order ${input.orderNumber} was approved. You do not need to send the item back.`,
      };
    case "pickup_scheduled":
      return {
        title: "Return pickup scheduled",
        body: `Your return pickup for order ${input.orderNumber} is scheduled for ${input.pickupScheduledAt?.toLocaleString("en-EG") ?? "the arranged time"}.`,
      };
    case "item_received":
      return {
        title: "Returned item received",
        body: `We received your returned items for order ${input.orderNumber}.`,
      };
    case "processing":
      return {
        title: "Refund processing",
        body: `Your refund for order ${input.orderNumber} is being processed.`,
      };
    case "completed":
      return {
        title: "Refund completed",
        body: `Your refund for order ${input.orderNumber} has been completed.`,
      };
    case "failed":
      return {
        title: "Refund needs attention",
        body: `We could not complete the refund for order ${input.orderNumber}. Our team needs to review it.`,
      };
    case "rejected":
      return {
        title: "Return request rejected",
        body: `Your return request for order ${input.orderNumber} was not approved.`,
      };
  }
}
