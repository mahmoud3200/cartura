import type { AnalyticsStatusCount } from "@cartura/contracts/analytics";

import { EmptyState, SeeAllLink } from "@/features/management/shared/components/admin-ui";
import {
  formatNumber,
  formatStatus,
} from "@/features/management/shared/lib/admin-utils";
import {
  getStatusSegments,
  getToneFillClass,
  summarizeOrderStatuses,
} from "@/features/management/analytics/lib/status-breakdown";
import { cn } from "@/shared/lib/utils";

export function OrderStatusPanel({
  items,
}: {
  items: AnalyticsStatusCount[];
}) {
  const { total, paid, attention } = summarizeOrderStatuses(items);
  const segments = getStatusSegments(items);
  const summary = segments
    .map((segment) => `${formatStatus(segment.status)}, ${segment.count}`)
    .join("; ");

  return (
    <section className="flex flex-col rounded-lg border border-border bg-card">
      <header className="flex items-baseline justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">Order flow</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {total > 0
              ? `${formatNumber(paid)} of ${formatNumber(total)} orders paid`
              : "No orders in this range"}
            {attention > 0
              ? ` · ${formatNumber(attention)} need attention`
              : ""}
          </p>
        </div>
        <SeeAllLink href="/dashboard/orders" />
      </header>

      {segments.length > 0 ? (
        <div className="space-y-5 p-5">
          <div
            role="img"
            aria-label={`Order status distribution: ${summary}`}
            className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-muted"
          >
            {segments.map((segment) => (
              <span
                key={segment.status}
                aria-hidden="true"
                className={cn("h-full", getToneFillClass(segment.tone))}
                style={{ width: `${segment.share}%` }}
              />
            ))}
          </div>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {segments.map((segment) => (
              <div
                key={segment.status}
                className="flex items-center justify-between gap-3"
              >
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      getToneFillClass(segment.tone),
                    )}
                  />
                  {formatStatus(segment.status)}
                </dt>
                <dd className="flex items-baseline gap-3 tabular-nums">
                  <span>{formatNumber(segment.count)}</span>
                  <span className="w-8 text-right text-xs text-muted-foreground">
                    {Math.round(segment.share)}%
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <div className="p-5">
          <EmptyState label="Status breakdown appears after the first order" />
        </div>
      )}
    </section>
  );
}
