import type { CreateOutboxEventInput } from "../outbox/index.js";
import type { PaymentWithOrder } from "./payments.repository.js";

export function createPaymentStatusNotification(input: {
  payment: PaymentWithOrder;
  previousStatus: string;
  nextStatus: string;
}): CreateOutboxEventInput | null {
  if (
    input.nextStatus !== "paid" &&
    input.nextStatus !== "failed"
  ) {
    return null;
  }

  if (input.previousStatus === input.nextStatus) {
    return null;
  }

  const paid = input.nextStatus === "paid";
  const type = paid ? "payment.paid" : "payment.failed";

  return {
    aggregateType: "payment",
    aggregateId: input.payment.id,
    eventType: type,
    payload: {
      notification: {
        userId: input.payment.order.userId,
        type,
        title: paid ? "Payment confirmed" : "Payment failed",
        body: paid
          ? `Payment for order ${input.payment.order.orderNumber} was confirmed.`
          : `Payment for order ${input.payment.order.orderNumber} failed.`,
        data: {
          orderId: input.payment.orderId,
          paymentId: input.payment.id,
        },
        emailRecipient: input.payment.order.user.email,
      },
    },
  };
}
