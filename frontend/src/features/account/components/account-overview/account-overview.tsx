import type { AddressResponse } from "@cartura/contracts/addresses";
import type { AuthUser } from "@cartura/contracts/auth";
import type { OrderSummary } from "@cartura/contracts/orders";

import { AccountActivitySummary } from "./account-activity-summary";
import { AccountDestinationGrid } from "./account-destination-grid";
import { AccountOverviewHero } from "./account-overview-hero";

export function AccountOverview({
  user,
  addresses,
  orders,
}: {
  user: AuthUser;
  addresses: AddressResponse[];
  orders: OrderSummary[];
}) {
  return (
    <div className="space-y-8 sm:space-y-12">
      <AccountOverviewHero user={user} />
      <AccountDestinationGrid />
      <AccountActivitySummary addresses={addresses} orders={orders} />
    </div>
  );
}
