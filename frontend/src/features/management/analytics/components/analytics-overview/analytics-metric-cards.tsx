import type { ComponentType } from "react";
import {
  AlertTriangle,
  Banknote,
  ReceiptText,
  RotateCcw,
  Users,
} from "lucide-react";

import type { AnalyticsOverviewResponse } from "@cartura/contracts/analytics";

import {
  formatMoney,
  formatNumber,
} from "@/features/management/shared/lib/admin-utils";

type MetricCard = {
  label: string;
  value: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
};

export function AnalyticsMetricCards({
  overview,
}: {
  overview: AnalyticsOverviewResponse;
}) {
  const primaryRevenue = overview.revenue[0] ?? null;
  const metricCards: MetricCard[] = [
    {
      label: "Net revenue",
      value: primaryRevenue
        ? formatMoney(primaryRevenue.net, primaryRevenue.currency)
        : "No paid revenue",
      detail: primaryRevenue
        ? `${formatMoney(primaryRevenue.gross, primaryRevenue.currency)} gross across ${primaryRevenue.paidOrders} paid orders`
        : "Paid payments will appear here",
      icon: Banknote,
    },
    {
      label: "Orders",
      value: formatNumber(overview.totals.orders),
      detail: `${formatNumber(overview.totals.paidOrders)} paid in this range`,
      icon: ReceiptText,
    },
    {
      label: "Users",
      value: formatNumber(overview.totals.users),
      detail: "New accounts in the selected period",
      icon: Users,
    },
    {
      label: "Return queue",
      value: formatNumber(overview.totals.refundsNeedingAction),
      detail: `${formatNumber(overview.totals.refunds)} requests opened in this range`,
      icon: RotateCcw,
    },
    {
      label: "Payment issues",
      value: formatNumber(overview.totals.paymentIssues),
      detail: "Failed or manual-review webhook events",
      icon: AlertTriangle,
    },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.25fr_repeat(4,minmax(0,1fr))]">
      {metricCards.map((metric) => (
        <article
          key={metric.label}
          className="rounded-lg border border-border bg-card p-5 transition duration-200 hover:-translate-y-0.5 hover:border-foreground/20"
        >
          <div className="mb-7 flex items-center justify-between">
            <metric.icon className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{metric.label}</p>
          <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">
            {metric.value}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {metric.detail}
          </p>
        </article>
      ))}
    </section>
  );
}
