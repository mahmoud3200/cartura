import { refundStatusSchema } from "@cartura/contracts/refunds";

import { listManagementRefunds } from "@/features/management/refunds/api/refunds-api";
import { RefundsTable } from "@/features/management/refunds/components/refunds-table/refunds-table";
import { PageHeader } from "@/features/management/shared/components/admin-ui";
import { ManagementFilters } from "@/features/management/shared/components/management-filters";
import { requireManagementRouteAccess } from "@/features/management/shared/lib/require-management-access";
import { PaginationControls } from "@/shared/ui/pagination-controls";
import {
  getManagementPage,
  getManagementFilter,
  type ManagementSearchParams,
} from "@/features/management/shared/lib/management-search-params";

const REFUNDS_PAGE_SIZE = 30;

export default async function RefundsPage({
  searchParams,
}: {
  searchParams: ManagementSearchParams;
}) {
  const params = await searchParams;
  const status = refundStatusSchema
    .optional()
    .catch(undefined)
    .parse(getManagementFilter(params.status));
  const permissionNames =
    await requireManagementRouteAccess("/dashboard/refunds");
  const refunds = await listManagementRefunds({
    page: getManagementPage(params.page),
    limit: REFUNDS_PAGE_SIZE,
    status,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Returns and refunds"
        description="Review customer return requests, coordinate pickups, receive inventory, and return funds through the original payment method."
      />
      <ManagementFilters
        action="/dashboard/refunds"
        selects={[
          {
            name: "status",
            label: "statuses",
            value: status,
            options: [
              "requested",
              "approved",
              "rejected",
              "pickup_scheduled",
              "item_received",
              "processing",
              "completed",
              "failed",
            ].map(
              (value) => ({ label: value, value }),
            ),
          },
        ]}
      />
      <RefundsTable
        refunds={refunds.data}
        canManageRefunds={permissionNames.includes("refunds.execute")}
      />
      <PaginationControls pagination={refunds.pagination} />
    </div>
  );
}
