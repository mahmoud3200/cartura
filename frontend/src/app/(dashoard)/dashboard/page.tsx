import { getAnalyticsOverview } from "@/features/management/analytics/api/analytics-api";
import { AnalyticsOverview } from "@/features/management/analytics/components/analytics-overview/analytics-overview";
import { parseAnalyticsRange } from "@/features/management/analytics/lib/analytics-range";
import { listCurrentManagementPermissionNames } from "@/features/management/shared/api/management-permissions-api";
import {
  canAccessManagementRoute,
  getManagementLandingPath,
} from "@/features/management/shared/lib/management-access";
import type { ManagementSearchParams } from "@/features/management/shared/lib/management-search-params";
import { redirect } from "next/navigation";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: ManagementSearchParams;
}) {
  const params = await searchParams;
  const range = parseAnalyticsRange(params.range);
  const permissionNames = await listCurrentManagementPermissionNames();

  if (!canAccessManagementRoute("/dashboard", permissionNames)) {
    redirect(getManagementLandingPath(permissionNames) ?? "/");
  }

  const overview = await getAnalyticsOverview({ range });

  return (
    <AnalyticsOverview overview={overview} permissionNames={permissionNames} />
  );
}
