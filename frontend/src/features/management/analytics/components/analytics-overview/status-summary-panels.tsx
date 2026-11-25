import type { AnalyticsOverviewResponse } from "@cartura/contracts/analytics";

import { OrderStatusPanel } from "./status-panels/order-status-panel";
import { RefundStatusPanel } from "./status-panels/refund-status-panel";
import { WebhookStatusPanel } from "./status-panels/webhook-status-panel";

export function StatusSummaryPanels({
  overview,
}: {
  overview: AnalyticsOverviewResponse;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <OrderStatusPanel items={overview.ordersByStatus} />
      <div className="grid gap-4">
        <RefundStatusPanel
          items={overview.refundsByStatus}
          needingAction={overview.totals.refundsNeedingAction}
        />
        <WebhookStatusPanel
          items={overview.paymentWebhooksByStatus}
          recentEvents={overview.recent.paymentWebhookEvents}
        />
      </div>
    </section>
  );
}
