import {
  orderStatusSchema,
  paymentMethodSchema,
} from "@cartura/contracts/orders";

import { listManagementOrders } from "@/features/management/orders/api/orders-api";
import { OrdersTable } from "@/features/management/orders/components/orders-table";
import { PageHeader } from "@/features/management/shared/components/admin-ui";
import { ManagementFilters } from "@/features/management/shared/components/management-filters";
import { requireManagementRouteAccess } from "@/features/management/shared/lib/require-management-access";
import { PaginationControls } from "@/shared/ui/pagination-controls";
import {
  getManagementPage,
  getManagementFilter,
  getManagementQuery,
  type ManagementSearchParams,
} from "@/features/management/shared/lib/management-search-params";

const ORDERS_PAGE_SIZE = 30;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: ManagementSearchParams;
}) {
  const params = await searchParams;
  const query = getManagementQuery(params.q);
  const status = orderStatusSchema
    .optional()
    .catch(undefined)
    .parse(getManagementFilter(params.status));
  const paymentMethod = paymentMethodSchema
    .optional()
    .catch(undefined)
    .parse(getManagementFilter(params.paymentMethod));
  const permissionNames =
    await requireManagementRouteAccess("/dashboard/orders");
  const orders = await listManagementOrders({
      page: getManagementPage(params.page),
      limit: ORDERS_PAGE_SIZE,
      q: query,
      status,
      paymentMethod,
    });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Orders"
        description="Review customer orders, payment state, customer identity, and the latest order totals."
      />
      <ManagementFilters
        action="/dashboard/orders"
        query={query}
        queryPlaceholder="Search order number or customer"
        selects={[
          {
            name: "status",
            label: "statuses",
            value: status,
            options: orderStatusSchema.options.map((value) => ({
              label: value.replaceAll("_", " "),
              value,
            })),
          },
          {
            name: "paymentMethod",
            label: "payment methods",
            value: paymentMethod,
            options: [
              { label: "Cash on delivery", value: "cash_on_delivery" },
              { label: "Card", value: "card" },
            ],
          },
        ]}
      />
      <OrdersTable
        orders={orders.data}
        canUpdateOrders={permissionNames.includes("orders.update")}
      />
      <PaginationControls pagination={orders.pagination} />
    </div>
  );
}
