import { RotateCcw } from "lucide-react";

import type { AnalyticsOverviewResponse } from "@cartura/contracts/analytics";

import {
  EmptyState,
  StatusBadge,
} from "@/features/management/shared/components/admin-ui";
import { formatMoney } from "@/features/management/shared/lib/admin-utils";
import { AnalyticsSectionHeader } from "./analytics-section-header";

export function RefundQueuePanel({
  overview,
}: {
  overview: AnalyticsOverviewResponse;
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <AnalyticsSectionHeader
        title="Refund queue"
        description="Newest refund records and execution state"
        icon={<RotateCcw className="size-5 text-muted-foreground" />}
        seeAllHref="/dashboard/refunds"
      />
      <div className="divide-y divide-border">
        {overview.recent.refunds.length > 0 ? (
          overview.recent.refunds.map((refund) => (
            <div
              key={refund.id}
              className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-sm">
                  {refund.order.orderNumber}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {refund.customer.name} · {refund.reasonCode?.replaceAll("_", " ") ?? "Other"}
                </p>
              </div>
              <StatusBadge status={refund.status} />
              <p className="font-mono text-sm tabular-nums">
                {formatMoney(refund.amount, refund.currency)}
              </p>
            </div>
          ))
        ) : (
          <div className="p-4">
            <EmptyState label="No refunds yet" />
          </div>
        )}
      </div>
    </div>
  );
}
