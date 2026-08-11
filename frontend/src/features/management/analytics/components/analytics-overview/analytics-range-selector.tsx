import Link from "next/link";

import type { AnalyticsRangePreset } from "@cartura/contracts/analytics";

import { getAnalyticsRangeLabel } from "@/features/management/analytics/lib/analytics-range";
import { cn } from "@/shared/lib/utils";

const analyticsRanges: AnalyticsRangePreset[] = ["7d", "30d", "90d", "all"];

export function AnalyticsRangeSelector({
  activeRange,
}: {
  activeRange: AnalyticsRangePreset;
}) {
  return (
    <nav
      aria-label="Analytics time range"
      className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-background p-1 sm:flex"
    >
      {analyticsRanges.map((range) => {
        const active = range === activeRange;

        return (
          <Link
            key={range}
            href={`/dashboard?range=${range}`}
            prefetch={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {getAnalyticsRangeLabel(range)}
          </Link>
        );
      })}
    </nav>
  );
}
