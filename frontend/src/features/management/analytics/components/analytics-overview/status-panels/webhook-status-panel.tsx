import type {
  AnalyticsOverviewResponse,
  AnalyticsStatusCount,
} from "@cartura/contracts/analytics";

import { EmptyState, SeeAllLink } from "@/features/management/shared/components/admin-ui";
import {
  formatNumber,
  formatStatus,
} from "@/features/management/shared/lib/admin-utils";
import {
  getStatusSegments,
  getToneFillClass,
  summarizeWebhookStatuses,
} from "@/features/management/analytics/lib/status-breakdown";
import { cn } from "@/shared/lib/utils";

type WebhookEvent = AnalyticsOverviewResponse["recent"]["paymentWebhookEvents"][number];

export function WebhookStatusPanel({
  items,
  recentEvents,
}: {
  items: AnalyticsStatusCount[];
  recentEvents: WebhookEvent[];
}) {
  const { total, issues, successRate } = summarizeWebhookStatuses(items);
  const segments = getStatusSegments(items);
  const lastIssue = recentEvents.find(
    (event) => event.status === "failed" || event.status === "manual_review",
  );

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex items-baseline justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">Webhook delivery</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatNumber(total)} events in this range
          </p>
        </div>
        <SeeAllLink href="/dashboard/payments" />
      </header>

      {segments.length > 0 ? (
        <div className="p-5">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-semibold tabular-nums text-accent-foreground">
              {successRate}%
            </span>
            <span className="text-sm text-muted-foreground">processed</span>
          </div>
          {issues > 0 ? (
            <p className="mt-1 text-sm text-destructive">
              {formatNumber(issues)} failed or manual review
            </p>
          ) : null}
          {lastIssue ? (
            <p
              className="mt-2 truncate text-xs text-muted-foreground"
              title={lastIssue.failureReason ?? undefined}
            >
              Last issue: {lastIssue.failureReason ?? formatStatus(lastIssue.status)}
            </p>
          ) : null}
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
          <EmptyState label="No webhook events in this range" />
        </div>
      )}
    </section>
  );
}
