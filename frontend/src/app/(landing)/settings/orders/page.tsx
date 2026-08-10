import { listCustomerOrders } from "@/features/account/api/orders-api";
import { OrdersList } from "@/features/account/components/orders-list";
import { AccountPageHeader } from "@/features/account/ui/account-page-header";
import { PaginationControls } from "@/shared/ui/pagination-controls";

const ORDERS_PAGE_SIZE = 20;

export default async function OrderSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedPage =
    typeof params.page === "string" ? Number(params.page) : 1;
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const orders = await listCustomerOrders({
    page,
    limit: ORDERS_PAGE_SIZE,
  });

  return (
    <div>
      <AccountPageHeader
        title="Order history"
        description="Review purchases, payment status, delivery details, and fulfillment progress."
      />
      <OrdersList orders={orders.data} />
      <div className="mt-6">
        <PaginationControls pagination={orders.pagination} />
      </div>
    </div>
  );
}
