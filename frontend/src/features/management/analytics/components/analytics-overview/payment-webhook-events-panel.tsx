import { CreditCard } from "lucide-react";

import type { AnalyticsOverviewResponse } from "@cartura/contracts/analytics";

import {
  EmptyState,
  StatusBadge,
} from "@/features/management/shared/components/admin-ui";
import { formatDateTime } from "@/features/management/shared/lib/admin-utils";
import { AnalyticsSectionHeader } from "./analytics-section-header";

export function PaymentWebhookEventsPanel({
  overview,
}: {
  overview: AnalyticsOverviewResponse;
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <AnalyticsSectionHeader
        title="Payment webhook events"
        description="Recent provider callbacks and recovery signals"
        icon={<CreditCard className="size-5 text-muted-foreground" />}
        seeAllHref="/dashboard/payments"
      />
      <div className="divide-y divide-border">
        {overview.recent.paymentWebhookEvents.length > 0 ? (
          overview.recent.paymentWebhookEvents.map((event) => (
            <div
              key={event.id}
              className="grid gap-3 p-4 sm:grid-cols-[0.8fr_1fr_auto_auto] sm:items-center"
            >
              <p className="font-mono text-sm">{event.provider}</p>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{event.eventType}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {event.failureReason || event.providerEventId}
                </p>
              </div>
              <StatusBadge status={event.status} />
              <p className="text-xs text-muted-foreground">
                {formatDateTime(event.receivedAt)}
              </p>
            </div>
          ))
        ) : (
          <div className="p-4">
            <EmptyState label="No payment webhook events yet" />
          </div>
        )}
      </div>
    </section>
  );
}
