import { Banknote } from "lucide-react";

import type { AnalyticsOverviewResponse } from "@cartura/contracts/analytics";

import { EmptyState } from "@/features/management/shared/components/admin-ui";
import { formatMoney } from "@/features/management/shared/lib/admin-utils";
import { AnalyticsSectionHeader } from "./analytics-section-header";

export function RevenuePanel({ overview }: { overview: AnalyticsOverviewResponse }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <AnalyticsSectionHeader
        title="Revenue by currency"
        description="Gross, refunds, and net totals are not converted"
        icon={<Banknote className="size-5 text-muted-foreground" />}
        seeAllHref="/dashboard/payments"
      />
      <div className="space-y-3 p-4">
        {overview.revenue.length > 0 ? (
          overview.revenue.map((item) => (
            <div key={item.currency} className="rounded-md bg-secondary p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{item.currency}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.paidOrders} paid orders
                  </p>
                </div>
                <p className="font-mono text-xl font-semibold tabular-nums">
                  {formatMoney(item.net, item.currency)}
                </p>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Gross</dt>
                  <dd className="mt-1 font-mono tabular-nums">
                    {formatMoney(item.gross, item.currency)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Refunded</dt>
                  <dd className="mt-1 font-mono tabular-nums">
                    {formatMoney(item.refunded, item.currency)}
                  </dd>
                </div>
              </dl>
            </div>
          ))
        ) : (
          <EmptyState label="No paid revenue in this range" />
        )}
      </div>
    </div>
  );
}
