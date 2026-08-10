import { listAddresses } from "@/features/account/api/addresses-api";
import { listCustomerOrders } from "@/features/account/api/orders-api";
import { AccountOverview } from "@/features/account/components/account-overview";
import { getCurrentAuthUser } from "@/features/auth/api/auth-api";

export default async function AccountOverviewPage() {
  const [user, addresses, ordersPage] = await Promise.all([
    getCurrentAuthUser(),
    listAddresses(),
    listCustomerOrders({ limit: 6 }),
  ]);

  if (!user) return null;

  return (
    <AccountOverview
      user={user}
      addresses={addresses}
      orders={ordersPage.data}
    />
  );
}
