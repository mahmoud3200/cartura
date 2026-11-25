import type { AnalyticsStatusCount } from "@cartura/contracts/analytics";

import { EmptyState, SeeAllLink } from "@/features/management/shared/components/admin-ui";
import {
  formatNumber,
  formatStatus,
} from "@/features/management/shared/lib/admin-utils";
import {
  getStatusSegments,
  getToneFillClass,
  summarizeRefundStatuses,
} from "@/features/management/analytics/lib/status-breakdown";
import { cn } from "@/shared/lib/utils";

export function RefundStatusPanel({
  items,
  needingAction,
}: {
  items: AnalyticsStatusCount[];
  needingAction: number;
}) {
  const { total, completed } = summarizeRefundStatuses(items, needingAction);
  const segments = getStatusSegments(items);

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex items-baseline justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">Refund queue</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatNumber(total)} requests in this range
          </p>
        </div>
        <SeeAllLink href="/dashboard/refunds" />
      </header>

      {segments.length > 0 ? (
        <div className="p-5">
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "font-mono text-3xl font-semibold tabular-nums",
                needingAction > 0 && "text-destructive",
              )}
            >
              {formatNumber(needingAction)}
            </span>
            <span className="text-sm text-muted-foreground">need action</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatNumber(completed)} completed
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2 border-t border-border pt-4 text-sm">
            {segments.map((segment) => (
              <div
                key={segment.status}
                className="flex items-center justify-between gap-2"
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
                <dd className="font-mono tabular-nums">
                  {formatNumber(segment.count)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <div className="p-5">
          <EmptyState label="No refunds in this range" />
        </div>
      )}
    </section>
  );
}
