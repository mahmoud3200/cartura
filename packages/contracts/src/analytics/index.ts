import { z } from "zod";
import { orderSummarySchema } from "../orders/index.js";
import { paymentWebhookEventSchema } from "../payments/index.js";
import { refundSchema } from "../refunds/index.js";
import { userSchema } from "../users/index.js";

export const analyticsRangePresetSchema = z.enum(["7d", "30d", "90d", "all"]);

export const analyticsOverviewQuerySchema = z.object({
  range: analyticsRangePresetSchema.default("30d"),
});

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

export const analyticsRecentUserSchema = userSchema;
export const analyticsRecentOrderSchema = orderSummarySchema;
export const analyticsRecentRefundSchema = refundSchema;
export const analyticsRecentPaymentWebhookEventSchema =
  paymentWebhookEventSchema.omit({ payload: true });

export const analyticsOverviewResponseSchema = z.object({
  generatedAt: z.string(),
  range: z.object({
    preset: analyticsRangePresetSchema,
    from: z.string().nullable(),
    to: z.string(),
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
