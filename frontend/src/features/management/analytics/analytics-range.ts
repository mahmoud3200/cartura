import {
  analyticsRangePresetSchema,
  type AnalyticsRangePreset,
} from "@cartura/contracts/analytics";

export function parseAnalyticsRange(
  value: string | string[] | undefined,
): AnalyticsRangePreset {
  const range = Array.isArray(value) ? value[0] : value;

  return analyticsRangePresetSchema.catch("30d").parse(range);
}

export function getAnalyticsRangeLabel(range: AnalyticsRangePreset) {
  switch (range) {
    case "7d":
      return "Last 7 days";
    case "30d":
      return "Last 30 days";
    case "90d":
      return "Last 90 days";
    case "all":
      return "All time";
  }
}
