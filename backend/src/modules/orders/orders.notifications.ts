import type { CreateOutboxEventInput } from "../outbox/index.js";
import type {
  OrderNotificationIntent,
  OrderNotificationRecipient,
} from "./orders.types.js";

export function createOrderPlacedNotification(input: {
  orderNumber: string;
  cashOnDelivery: boolean;
}): OrderNotificationIntent {
  return {
    type: "order.placed",
    title: "Order placed",
    body: input.cashOnDelivery
      ? `Order ${input.orderNumber} was placed with cash on delivery.`
      : `Order ${input.orderNumber} was placed and is awaiting payment.`,
    data: {
      orderNumber: input.orderNumber,
      ...(input.cashOnDelivery
        ? { paymentMethod: "cash_on_delivery" }
        : {}),
    },
  };
}

export function createOrderStatusNotification(input: {
  orderNumber: string;
  status: "processing" | "shipped" | "completed" | "cancelled";
}): OrderNotificationIntent {
  const content = {
    processing: {
      title: "Order is being prepared",
      body: `Order ${input.orderNumber} is now being prepared.`,
    },
    shipped: {
      title: "Order shipped",
      body: `Order ${input.orderNumber} has shipped.`,
    },
    completed: {
      title: "Order completed",
      body: `Order ${input.orderNumber} has been completed.`,
    },
    cancelled: {
      title: "Order cancelled",
      body: `Order ${input.orderNumber} was cancelled.`,
    },
  }[input.status];

  return {
    type: `order.${input.status}`,
    title: content.title,
    body: content.body,
    data: {
      orderNumber: input.orderNumber,
      status: input.status,
    },
  };
}

export function createExpiredOrderNotification(
  orderNumber: string,
): OrderNotificationIntent {
  return {
    type: "order.expired",
    title: "Order cancelled",
    body: `Order ${orderNumber} was cancelled because the payment window expired.`,
    data: {
      orderNumber,
      status: "cancelled",
      reason: "payment_expired",
    },
  };
}

export function createOrderNotificationOutboxEvent(
  eventType: string,
  intent: OrderNotificationIntent,
  recipient: OrderNotificationRecipient,
): CreateOutboxEventInput {
  return {
    aggregateType: "order",
    aggregateId: recipient.orderId,
    eventType,
    payload: {
      notification: {
        userId: recipient.userId,
        type: intent.type,
        title: intent.title,
        body: intent.body,
        data: {
          ...intent.data,
          orderId: recipient.orderId,
        },
        emailRecipient: recipient.emailRecipient,
      },
    },
  };
}
