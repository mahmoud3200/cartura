import { z } from "zod";
import { orderStatusSchema } from "../orders/index.js";
import { paymentWebhookEventStatusSchema } from "../payments/index.js";
import { refundReasonSchema, refundStatusSchema } from "../refunds/index.js";
import { userAccountStatusSchema } from "../users/index.js";

export const analyticsRangePresetSchema = z.enum(["7d", "30d", "90d", "all"]);

export const analyticsOverviewQuerySchema = z.object({
  range: analyticsRangePresetSchema.default("30d"),
}).strict();

export const analyticsStatusCountSchema = z.object({
  status: z.string(),
  count: z.number().int().nonnegative(),
});

export const analyticsRevenueSchema = z.object({
  currency: z.string().length(3),
  gross: z.number().nonnegative(),
  refunded: z.number().nonnegative(),
  net: z.number(),
  paidOrders: z.number().int().nonnegative(),
});

export const analyticsRecentUserSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  accountStatus: userAccountStatusSchema,
});

export const analyticsRecentOrderSchema = z.object({
  id: z.uuid(),
  orderNumber: z.string(),
  status: orderStatusSchema,
  totalAmount: z.number(),
  currency: z.string().length(3),
  createdAt: z.iso.datetime(),
  customer: z.object({
    name: z.string(),
    email: z.email(),
  }),
});

export const analyticsRecentRefundSchema = z.object({
  id: z.uuid(),
  amount: z.number(),
  currency: z.string().length(3),
  status: refundStatusSchema,
  reasonCode: refundReasonSchema.nullable(),
  order: z.object({ orderNumber: z.string() }),
  customer: z.object({ name: z.string() }),
});

export const analyticsRecentPaymentWebhookEventSchema = z.object({
  id: z.uuid(),
  provider: z.string(),
  providerEventId: z.string(),
  eventType: z.string(),
  status: paymentWebhookEventStatusSchema,
  failureReason: z.string().nullable(),
  receivedAt: z.iso.datetime(),
});

export const analyticsOverviewResponseSchema = z.object({
  generatedAt: z.iso.datetime(),
  range: z.object({
    preset: analyticsRangePresetSchema,
    from: z.iso.datetime().nullable(),
    to: z.iso.datetime(),
  }),
  totals: z.object({
    orders: z.number().int().nonnegative(),
    paidOrders: z.number().int().nonnegative(),
    users: z.number().int().nonnegative(),
    refunds: z.number().int().nonnegative(),
    refundsNeedingAction: z.number().int().nonnegative(),
    paymentIssues: z.number().int().nonnegative(),
  }),
  revenue: z.array(analyticsRevenueSchema),
  ordersByStatus: z.array(analyticsStatusCountSchema),
  refundsByStatus: z.array(analyticsStatusCountSchema),
  paymentWebhooksByStatus: z.array(analyticsStatusCountSchema),
  recent: z.object({
    orders: z.array(analyticsRecentOrderSchema),
    users: z.array(analyticsRecentUserSchema),
    refunds: z.array(analyticsRecentRefundSchema),
    paymentWebhookEvents: z.array(analyticsRecentPaymentWebhookEventSchema),
  }),
});

export type AnalyticsRangePreset = z.infer<typeof analyticsRangePresetSchema>;
export type AnalyticsOverviewQuery = z.infer<typeof analyticsOverviewQuerySchema>;
export type AnalyticsStatusCount = z.infer<typeof analyticsStatusCountSchema>;
export type AnalyticsRevenue = z.infer<typeof analyticsRevenueSchema>;
export type AnalyticsOverviewResponse = z.infer<
  typeof analyticsOverviewResponseSchema
>;
