import { z } from "zod";

import {
  dataListResponseSchema,
  dataResponseSchema,
  paginatedQuerySchema,
  paginatedResponseSchema,
} from "../common/index.js";
import {
  paymentRecordProviderSchema,
  paymentRecordStatusSchema,
} from "../payments/index.js";

export const paymentMethodSchema = z.enum(["card", "cash_on_delivery"]);
export const ORDER_CURRENCY = "EGP" as const;
export const orderCurrencySchema = z.literal(ORDER_CURRENCY);
export const orderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "paid",
  "payment_failed",
  "processing",
  "shipped",
  "completed",
  "cancelled",
  "partially_refunded",
  "refunded",
]);
export const ORDER_STATUSES = orderStatusSchema.options;
export const manageableOrderStatusSchema = z.enum([
  "processing",
  "shipped",
  "completed",
  "cancelled",
]);

export const checkoutOrderRequestSchema = z.object({
  addressId: z.uuid(),
  paymentMethod: paymentMethodSchema.default("card"),
  idempotencyKey: z.string().trim().min(8).max(120),
  notes: z.string().trim().max(500).optional(),
}).strict();

export const buyNowCheckoutRequestSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().positive().max(99).default(1),
  addressId: z.uuid(),
  paymentMethod: paymentMethodSchema.default("card"),
  idempotencyKey: z.string().trim().min(8).max(120),
  notes: z.string().trim().max(500).optional(),
}).strict();

export const listOrdersQuerySchema = paginatedQuerySchema({
  status: orderStatusSchema.optional(),
  paymentMethod: paymentMethodSchema.optional(),
  q: z.string().trim().min(1).max(120).optional(),
});

export const updateOrderStatusRequestSchema = z.object({
  status: manageableOrderStatusSchema,
  note: z.string().trim().max(500).optional(),
}).strict();

export const orderIdParamsSchema = z.object({ orderId: z.uuid() }).strict();

export const orderStatusActorSchema = z.enum([
  "customer",
  "staff",
  "system",
  "provider",
]);

export const orderCustomerSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
});

export const orderPaymentSummarySchema = z.object({
  id: z.uuid(),
  provider: paymentRecordProviderSchema,
  providerTransactionId: z.string().nullable(),
  paymentMethod: paymentMethodSchema,
  status: paymentRecordStatusSchema,
  amount: z.number(),
  currency: orderCurrencySchema,
  failureReason: z.string().nullable(),
  paidAt: z.iso.datetime().nullable(),
  refundedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const orderAddressSchema = z.object({
  recipientName: z.string(),
  phoneNumber: z.string(),
  country: z.string(),
  city: z.string(),
  area: z.string(),
  streetAddress: z.string(),
  postalCode: z.string().nullable(),
});

export const orderItemSchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
  productName: z.string(),
  productSku: z.string(),
  unitPrice: z.number(),
  quantity: z.number().int().positive(),
  totalPrice: z.number(),
});

export const orderStatusHistorySchema = z.object({
  id: z.uuid(),
  actorType: orderStatusActorSchema,
  changedBy: z.uuid().nullable(),
  previousStatus: orderStatusSchema.nullable(),
  newStatus: orderStatusSchema,
  note: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export const orderSummarySchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  orderNumber: z.string(),
  status: orderStatusSchema,
  subtotal: z.number(),
  shippingCost: z.number(),
  discountAmount: z.number(),
  totalAmount: z.number(),
  currency: orderCurrencySchema,
  notes: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable(),
  cancelledAt: z.iso.datetime().nullable(),
  customer: orderCustomerSchema,
  address: orderAddressSchema.nullable(),
  items: z.array(orderItemSchema),
  payment: orderPaymentSummarySchema.nullable(),
  statusHistory: z.array(orderStatusHistorySchema),
});

export const orderDataResponseSchema = dataResponseSchema(orderSummarySchema);
export const orderListResponseSchema = dataListResponseSchema(orderSummarySchema);
export const paginatedOrderListResponseSchema = paginatedResponseSchema(orderSummarySchema);

export const checkoutOrderResponseSchema = dataResponseSchema(
  z.object({
    order: orderSummarySchema,
    checkoutUrl: z.url().nullable(),
  }),
);

export const buyNowCheckoutResponseSchema = dataResponseSchema(
  z.object({
    order: orderSummarySchema,
    checkoutUrl: z.url().nullable(),
  }),
);

export type CheckoutOrderRequest = z.infer<typeof checkoutOrderRequestSchema>;
export type OrderIdParams = z.infer<typeof orderIdParamsSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type ManageableOrderStatus = z.infer<
  typeof manageableOrderStatusSchema
>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type UpdateOrderStatusRequest = z.infer<
  typeof updateOrderStatusRequestSchema
>;
export type OrderCustomer = z.infer<typeof orderCustomerSchema>;
export type OrderPaymentSummary = z.infer<typeof orderPaymentSummarySchema>;
export type OrderAddress = z.infer<typeof orderAddressSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type OrderStatusHistory = z.infer<typeof orderStatusHistorySchema>;
export type OrderSummary = z.infer<typeof orderSummarySchema>;
export type CheckoutOrderResponse = z.infer<
  typeof checkoutOrderResponseSchema
>;
export type BuyNowCheckoutRequest = z.infer<typeof buyNowCheckoutRequestSchema>;
export type BuyNowCheckoutResponse = z.infer<
  typeof buyNowCheckoutResponseSchema
>;
