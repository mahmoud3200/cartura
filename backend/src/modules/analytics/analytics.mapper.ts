import {
  analyticsRecentOrderSchema,
  analyticsRecentPaymentWebhookEventSchema,
  analyticsRecentRefundSchema,
  analyticsRecentUserSchema,
  type AnalyticsOverviewResponse,
} from "@cartura/contracts/analytics";

import type { AnalyticsOverviewData } from "./analytics.types.js";

export function mapAnalyticsOverview(
  data: AnalyticsOverviewData,
): AnalyticsOverviewResponse {
  const { rangeSnapshot, operational } = data;

  return {
    generatedAt: rangeSnapshot.generatedAt,
    range: rangeSnapshot.range,
    totals: {
      ...rangeSnapshot.totals,
      refundsNeedingAction: operational.refundsNeedingAction,
      paymentIssues: operational.paymentIssues,
    },
    revenue: rangeSnapshot.revenue,
    ordersByStatus: rangeSnapshot.ordersByStatus,
    refundsByStatus: rangeSnapshot.refundsByStatus,
    paymentWebhooksByStatus: rangeSnapshot.paymentWebhooksByStatus,
    recent: {
      orders: operational.recentOrders.map((order) =>
        analyticsRecentOrderSchema.parse({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: order.totalAmount,
          currency: order.currency,
          createdAt: order.createdAt.toISOString(),
          customer: {
            name: order.user.name,
            email: order.user.email,
          },
        }),
      ),
      users: operational.recentUsers.map((user) =>
        analyticsRecentUserSchema.parse({
          id: user.id,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          accountStatus: user.accountStatus,
        }),
      ),
      refunds: operational.recentRefunds.map((refund) =>
        analyticsRecentRefundSchema.parse({
          id: refund.id,
          amount: refund.amount,
          currency: refund.currency,
          status: refund.status,
          reasonCode: refund.reasonCode,
          order: {
            orderNumber: refund.payment.order.orderNumber,
          },
          customer: {
            name: refund.payment.order.user.name,
          },
        }),
      ),
      paymentWebhookEvents: operational.recentPaymentWebhookEvents.map((event) =>
        analyticsRecentPaymentWebhookEventSchema.parse({
          id: event.id,
          provider: event.provider,
          providerEventId: event.providerEventId,
          eventType: event.eventType,
          status: event.status,
          failureReason: event.failureReason,
          receivedAt: event.receivedAt.toISOString(),
        }),
      ),
    },
  };
}
