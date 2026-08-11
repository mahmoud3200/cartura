import type { AddressResponse } from "@cartura/contracts/addresses";
import type { OrderSummary } from "@cartura/contracts/orders";
import Link from "next/link";

import {
  formatAccountDate,
  formatAccountMoney,
  formatOrderStatus,
} from "../../lib/account-formatters";

export function AccountActivitySummary({
  addresses,
  orders,
}: {
  addresses: AddressResponse[];
  orders: OrderSummary[];
}) {
  const defaultAddress = addresses.find((address) => address.isDefault);

  return (
    <section className="grid min-w-0 gap-4 xl:grid-cols-[1.4fr_0.8fr]">
      <div className="min-w-0 rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          <Link href="/settings/orders" className="text-sm font-medium hover:underline">
            View all
          </Link>
        </div>
        {orders.length ? (
          <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
            {orders.slice(0, 4).map((order) => (
              <Link
                key={order.id}
                href={`/settings/orders/${order.id}`}
                className="min-w-0 rounded-lg bg-muted/65 p-4 transition hover:bg-muted active:translate-y-px"
              >
                <div className="flex min-w-0 items-center justify-between gap-4">
                  <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">
                    {order.orderNumber}
                  </span>
                  <span className="shrink-0 text-xs font-medium">
                    {formatOrderStatus(order.status)}
                  </span>
                </div>
                <p className="mt-7 truncate text-lg font-semibold tabular-nums">
                  {formatAccountMoney(order.totalAmount, order.currency)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatAccountDate(order.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <AccountSummaryEmptyState
            title="No orders yet"
            description="Your purchases will appear here after checkout."
          />
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Default address</h2>
          <Link href="/settings/addresses" className="text-sm font-medium hover:underline">
            Manage
          </Link>
        </div>
        {defaultAddress ? (
          <address className="mt-5 text-sm not-italic leading-6 text-muted-foreground">
            <strong className="block text-foreground">
              {defaultAddress.addressName}
            </strong>
            {defaultAddress.recipientName}
            <br />
            {defaultAddress.streetAddress}
            <br />
            {defaultAddress.area}, {defaultAddress.city}
            <br />
            {defaultAddress.country}
          </address>
        ) : (
          <AccountSummaryEmptyState
            title="No default address"
            description="Save one to make checkout faster."
          />
        )}
      </div>
    </section>
  );
}

function AccountSummaryEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-5 rounded-lg bg-muted/60 p-5">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
