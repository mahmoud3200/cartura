import type { ReactNode } from "react";
import { CheckCircle2, CreditCard, RotateCcw } from "lucide-react";

import type { AnalyticsOverviewResponse } from "@cartura/contracts/analytics";

import { EmptyState } from "@/features/management/shared/components/admin-ui";
import { formatStatus } from "@/features/management/shared/lib/admin-utils";
import { AnalyticsSectionHeader } from "./analytics-section-header";

export function StatusSummaryPanels({
  overview,
}: {
  overview: AnalyticsOverviewResponse;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <StatusPanel
        title="Order statuses"
        icon={<CheckCircle2 className="size-5 text-muted-foreground" />}
        items={overview.ordersByStatus}
      />
      <StatusPanel
        title="Refund statuses"
        icon={<RotateCcw className="size-5 text-muted-foreground" />}
        items={overview.refundsByStatus}
      />
      <StatusPanel
        title="Webhook statuses"
        icon={<CreditCard className="size-5 text-muted-foreground" />}
        items={overview.paymentWebhooksByStatus}
      />
    </section>
  );
}

function StatusPanel({
  title,
  icon,
  items,
}: {
  title: string;
  icon: ReactNode;
  items: Array<{ status: string; count: number }>;
}) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <article className="rounded-lg border border-border bg-card">
      <AnalyticsSectionHeader
        title={title}
        description="Grouped by current status"
        icon={icon}
      />
      <div className="space-y-3 p-4">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.status}>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{formatStatus(item.status)}</span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {item.count}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-sm bg-secondary">
                <div
                  className="h-full rounded-sm bg-foreground"
                  style={{ width: `${Math.max((item.count / max) * 100, 8)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <EmptyState label="No statuses in this range" />
        )}
      </div>
    </article>
  );
}
