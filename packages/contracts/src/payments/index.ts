import { z } from "zod";

import { paginatedQuerySchema } from "../common/index.js";

export const paymobWebhookQuerySchema = z.object({
  hmac: z.string().optional(),
}).strict();

export const paymentWebhookEventStatusSchema = z.enum([
  "received",
  "processing",
  "processed",
  "failed",
  "manual_review",
]);
export const PAYMENT_WEBHOOK_EVENT_STATUSES =
  paymentWebhookEventStatusSchema.options;

export const paymentProviderSchema = z.enum(["paymob"]);
export const paymentRecordProviderSchema = z.enum([
  "paymob",
  "cash_on_delivery",
]);
export const paymentRecordStatusSchema = z.enum([
  "pending",
  "paid",
  "failed",
  "cancelled",
  "partially_refunded",
  "refunded",
]);

export const paymentIdParamsSchema = z.object({ paymentId: z.uuid() }).strict();
export const paymentWebhookEventIdParamsSchema = z.object({
  eventId: z.uuid(),
}).strict();

export const listPaymentWebhookEventsQuerySchema = paginatedQuerySchema({
  status: paymentWebhookEventStatusSchema.optional(),
  provider: paymentProviderSchema.optional(),
  paymentId: z.uuid().optional(),
});

export const paymentWebhookEventSchema = z.object({
  id: z.uuid(),
  paymentId: z.uuid().nullable(),
  provider: paymentProviderSchema,
  providerEventId: z.string(),
  eventType: z.string(),
  status: paymentWebhookEventStatusSchema,
  attempts: z.number().int().nonnegative(),
  payload: z.unknown(),
  failureReason: z.string().nullable(),
  receivedAt: z.iso.datetime(),
  processedAt: z.iso.datetime().nullable(),
});

export const reprocessPaymentWebhookResponseSchema = z.discriminatedUnion(
  "outcome",
  [
    z.object({ outcome: z.literal("unmatched") }).strict(),
    z.object({ outcome: z.literal("duplicate"), matched: z.boolean() }).strict(),
    z.object({ outcome: z.literal("processing"), matched: z.boolean() }).strict(),
    z.object({ outcome: z.literal("manual_review") }).strict(),
    z.object({ outcome: z.literal("refund_completed") }).strict(),
    z.object({ outcome: z.literal("payment_updated") }).strict(),
  ],
);

export const paymentSchema = z.object({
  id: z.uuid(),
  orderId: z.uuid(),
  provider: paymentRecordProviderSchema,
  providerTransactionId: z.string().nullable(),
  paymentMethod: z.string(),
  status: paymentRecordStatusSchema,
  amount: z.number(),
  currency: z.string(),
  failureReason: z.string().nullable(),
  paidAt: z.iso.datetime().nullable(),
  refundedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  order: z.object({
    id: z.uuid(),
    orderNumber: z.string(),
    status: z.string(),
    userId: z.uuid(),
  }),
  refunds: z.array(z.object({
    id: z.uuid(),
    amount: z.number(),
    currency: z.string(),
    status: z.string(),
    reason: z.string().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    completedAt: z.iso.datetime().nullable(),
    failedAt: z.iso.datetime().nullable(),
  })),
});

export type PaymobWebhookQuery = z.infer<typeof paymobWebhookQuerySchema>;
export type PaymentIdParams = z.infer<typeof paymentIdParamsSchema>;
export type PaymentWebhookEventIdParams = z.infer<
  typeof paymentWebhookEventIdParamsSchema
>;
export type ListPaymentWebhookEventsQuery = z.infer<
  typeof listPaymentWebhookEventsQuerySchema
>;
export type PaymentWebhookEvent = z.infer<typeof paymentWebhookEventSchema>;
export type PaymentProvider = z.infer<typeof paymentProviderSchema>;
export type PaymentRecordProvider = z.infer<
  typeof paymentRecordProviderSchema
>;
export type PaymentRecordStatus = z.infer<typeof paymentRecordStatusSchema>;
export type Payment = z.infer<typeof paymentSchema>;
export type ReprocessPaymentWebhookResponse = z.infer<
  typeof reprocessPaymentWebhookResponseSchema
>;
