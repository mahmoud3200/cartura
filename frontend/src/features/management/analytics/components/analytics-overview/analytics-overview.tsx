import type { AnalyticsOverviewResponse } from "@cartura/contracts/analytics";

import { AnalyticsHero } from "./analytics-hero";
import { AnalyticsMetricCards } from "./analytics-metric-cards";
import { CurrentPermissionsView } from "@/features/management/roles/ui/current-permissions-view";
import { PaymentWebhookEventsPanel } from "./payment-webhook-events-panel";
import { RecentOrdersPanel } from "./recent-orders-panel";
import { RecentUsersPanel } from "./recent-users-panel";
import { RefundQueuePanel } from "./refund-queue-panel";
import { RevenuePanel } from "./revenue-panel";
import { StatusSummaryPanels } from "./status-summary-panels";

export function AnalyticsOverview({
  overview,
  permissionNames,
}: {
  overview: AnalyticsOverviewResponse;
  permissionNames: string[];
}) {
  return (
    <div className="space-y-5">
      <AnalyticsHero overview={overview} />
      <CurrentPermissionsView permissionNames={permissionNames} />
      <AnalyticsMetricCards overview={overview} />

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <RecentOrdersPanel overview={overview} />
        <RevenuePanel overview={overview} />
      </section>

      <StatusSummaryPanels overview={overview} />

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <RecentUsersPanel overview={overview} />
        <RefundQueuePanel overview={overview} />
      </section>

      <PaymentWebhookEventsPanel overview={overview} />
    </div>
  );
}
