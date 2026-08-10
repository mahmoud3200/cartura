import { z } from "zod";

import {
  dataListResponseSchema,
  dataResponseSchema,
  paginatedResponseSchema,
  paginationQuerySchema,
} from "../common/index.js";

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
});

export const buyNowCheckoutRequestSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().positive().max(99).default(1),
  addressId: z.uuid(),
  paymentMethod: paymentMethodSchema.default("card"),
  idempotencyKey: z.string().trim().min(8).max(120),
  notes: z.string().trim().max(500).optional(),
});

export const listOrdersQuerySchema = z.intersection(
  paginationQuerySchema,
  z.object({
    status: orderStatusSchema.optional(),
    paymentMethod: paymentMethodSchema.optional(),
    q: z.string().trim().min(1).max(120).optional(),
  }),
);

export const updateOrderStatusRequestSchema = z.object({
  status: manageableOrderStatusSchema,
  note: z.string().trim().max(500).optional(),
});

export const orderCustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
});

export const orderPaymentSummarySchema = z.object({
  id: z.string(),
  provider: z.string().optional(),
  providerTransactionId: z.string().nullable().optional(),
  paymentMethod: z.string().optional(),
  status: z.string(),
  amount: z.number(),
  currency: z.string(),
  failureReason: z.string().nullable(),
  paidAt: z.string().nullable(),
  refundedAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  metadata: z.unknown().nullable().optional(),
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
  id: z.string(),
  productId: z.string(),
  productName: z.string(),
  productSku: z.string(),
  unitPrice: z.number(),
  quantity: z.number().int().positive(),
  totalPrice: z.number(),
});

export const orderStatusHistorySchema = z.object({
  id: z.string(),
  actorType: z.string(),
  changedBy: z.string().nullable(),
  previousStatus: z.string().nullable(),
  newStatus: z.string(),
  note: z.string().nullable(),
  createdAt: z.string(),
});

export const orderSummarySchema = z.object({
  id: z.string(),
  userId: z.string(),
  orderNumber: z.string(),
  status: z.string(),
  subtotal: z.number(),
  shippingCost: z.number(),
  discountAmount: z.number(),
  totalAmount: z.number(),
  currency: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().nullable(),
  cancelledAt: z.string().nullable(),
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
