import { CalendarClock } from "lucide-react";

import type { AnalyticsOverviewResponse } from "@cartura/contracts/analytics";

import { getAnalyticsRangeLabel } from "@/features/management/analytics/analytics-range";
import { formatDateTime } from "@/features/management/shared/lib/admin-utils";
import { AnalyticsRangeSelector } from "./analytics-range-selector";

export function AnalyticsHero({
  overview,
}: {
  overview: AnalyticsOverviewResponse;
}) {
  const rangeLabel = getAnalyticsRangeLabel(overview.range.preset);
  const rangeDescription =
    overview.range.preset === "all"
      ? "your full history"
      : `the ${rangeLabel.toLowerCase()}`;

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Management analytics</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-balance sm:text-4xl">
            Store operations across {rangeDescription}
          </h1>
        </div>
        <div className="flex flex-col gap-3 sm:items-start xl:items-end">
          <AnalyticsRangeSelector activeRange={overview.range.preset} />
          <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
            <CalendarClock className="size-4 text-primary" />
            Updated {formatDateTime(overview.generatedAt)}
          </div>
        </div>
      </div>
    </section>
  );
}
