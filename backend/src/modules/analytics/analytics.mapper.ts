import type { AnalyticsOverviewResponse } from "@cartura/contracts/analytics";

import { mapOrder } from "../orders/orders.mapper.js";
import { mapPaymentWebhookEvent } from "../payments/payments.mapper.js";
import { mapRefund } from "../refunds/refunds.mapper.js";
import { mapUser } from "../users/users.mapper.js";
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
      orders: operational.recentOrders.map(mapOrder),
      users: operational.recentUsers.map(mapUser),
      refunds: operational.recentRefunds.map(mapRefund),
      paymentWebhookEvents: operational.recentPaymentWebhookEvents.map((event) => {
        const { payload: _payload, ...mappedEvent } =
          mapPaymentWebhookEvent(event);

        return mappedEvent;
      }),
    },
  };
}
