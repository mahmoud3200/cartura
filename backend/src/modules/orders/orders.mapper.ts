import type {
  CheckoutOrderResponse,
  OrderSummary,
} from "@cartura/contracts/orders";
import {
  orderCurrencySchema,
  orderStatusActorSchema,
  orderStatusSchema,
  paymentMethodSchema,
} from "@cartura/contracts/orders";
import {
  paymentRecordProviderSchema,
  paymentRecordStatusSchema,
} from "@cartura/contracts/payments";

import type { OrderWithDetails } from "./orders.types.js";

export function mapOrder(order: OrderWithDetails): OrderSummary {
  return {
    id: order.id,
    userId: order.userId,
    orderNumber: order.orderNumber,
    status: orderStatusSchema.parse(order.status),
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    discountAmount: Number(order.discountAmount),
    totalAmount: Number(order.totalAmount),
    currency: orderCurrencySchema.parse(order.currency),
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    completedAt: order.completedAt?.toISOString() ?? null,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    customer: {
      id: order.user.id,
      name: order.user.name,
      firstName: order.user.firstName,
      lastName: order.user.lastName,
      email: order.user.email,
    },
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
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productSku: item.productSku,
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      totalPrice: Number(item.totalPrice),
    })),
    payment: order.payment
      ? {
          id: order.payment.id,
          provider: paymentRecordProviderSchema.parse(order.payment.provider),
          providerTransactionId: order.payment.providerTransactionId,
          paymentMethod: paymentMethodSchema.parse(order.payment.paymentMethod),
          status: paymentRecordStatusSchema.parse(order.payment.status),
          amount: Number(order.payment.amount),
          currency: orderCurrencySchema.parse(order.payment.currency),
          failureReason: order.payment.failureReason,
          paidAt: order.payment.paidAt?.toISOString() ?? null,
          refundedAt: order.payment.refundedAt?.toISOString() ?? null,
          createdAt: order.payment.createdAt.toISOString(),
          updatedAt: order.payment.updatedAt.toISOString(),
        }
      : null,
    statusHistory: order.statusHistory.map((entry) => ({
      id: entry.id,
      actorType: orderStatusActorSchema.parse(entry.actorType),
      changedBy: entry.changedBy,
      previousStatus: entry.previousStatus
        ? orderStatusSchema.parse(entry.previousStatus)
        : null,
      newStatus: orderStatusSchema.parse(entry.newStatus),
      note: entry.note,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}

export function mapCheckoutOrderResult(input: {
  order: OrderWithDetails;
  checkoutUrl: string | null;
}): CheckoutOrderResponse["data"] {
  return {
    order: mapOrder(input.order),
    checkoutUrl: input.checkoutUrl,
  };
}
