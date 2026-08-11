import { z } from "zod";

import { paginationQuerySchema } from "../common/index.js";

export const paymobWebhookQuerySchema = z.object({
  hmac: z.string().optional(),
});

export const paymentWebhookEventStatusSchema = z.enum([
  "received",
  "processed",
  "failed",
  "manual_review",
]);
export const PAYMENT_WEBHOOK_EVENT_STATUSES =
  paymentWebhookEventStatusSchema.options;

export const paymentProviderSchema = z.enum(["paymob"]);

export const listPaymentWebhookEventsQuerySchema = z.intersection(
  paginationQuerySchema,
  z.object({
    status: paymentWebhookEventStatusSchema.optional(),
    provider: paymentProviderSchema.optional(),
    paymentId: z.uuid().optional(),
  }),
);

export const paymentWebhookEventSchema = z.object({
  id: z.string(),
  paymentId: z.string().nullable(),
  provider: z.string(),
  providerEventId: z.string(),
  eventType: z.string(),
  status: paymentWebhookEventStatusSchema,
  attempts: z.number().int().nonnegative(),
  payload: z.unknown(),
  failureReason: z.string().nullable(),
  receivedAt: z.string(),
  processedAt: z.string().nullable(),
});

export const reprocessPaymentWebhookResponseSchema = z.object({
  matched: z.boolean(),
  duplicate: z.boolean().optional(),
  manualReview: z.boolean().optional(),
  refundCompleted: z.boolean().optional(),
});

export type PaymobWebhookQuery = z.infer<typeof paymobWebhookQuerySchema>;
export type ListPaymentWebhookEventsQuery = z.infer<
  typeof listPaymentWebhookEventsQuerySchema
>;
export type PaymentWebhookEvent = z.infer<typeof paymentWebhookEventSchema>;
export type PaymentProvider = z.infer<typeof paymentProviderSchema>;
export type ReprocessPaymentWebhookResponse = z.infer<
  typeof reprocessPaymentWebhookResponseSchema
>;
