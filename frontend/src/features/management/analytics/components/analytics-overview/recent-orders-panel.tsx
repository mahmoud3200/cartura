import { ReceiptText } from "lucide-react";

import type { AnalyticsOverviewResponse } from "@cartura/contracts/analytics";

import {
  EmptyState,
  StatusBadge,
} from "@/features/management/shared/components/admin-ui";
import {
  formatDateTime,
  formatMoney,
} from "@/features/management/shared/lib/admin-utils";
import { AnalyticsSectionHeader } from "./analytics-section-header";

export function RecentOrdersPanel({
  overview,
}: {
  overview: AnalyticsOverviewResponse;
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <AnalyticsSectionHeader
        title="Recent orders"
        description="Newest customer orders across the store"
        icon={<ReceiptText className="size-5 text-muted-foreground" />}
        seeAllHref="/dashboard/orders"
      />
      <div className="divide-y divide-border">
        {overview.recent.orders.length > 0 ? (
          overview.recent.orders.map((order) => (
            <div
              key={order.id}
              className="grid gap-3 p-4 sm:grid-cols-[0.8fr_1fr_auto_auto] sm:items-center"
            >
              <div>
                <p className="font-mono text-sm">{order.orderNumber}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">{order.customer.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {order.customer.email}
                </p>
              </div>
              <StatusBadge status={order.status} />
              <p className="font-mono text-sm tabular-nums">
                {formatMoney(order.totalAmount, order.currency)}
              </p>
            </div>
          ))
        ) : (
          <div className="p-4">
            <EmptyState label="No orders yet" />
          </div>
        )}
      </div>
    </div>
  );
}
