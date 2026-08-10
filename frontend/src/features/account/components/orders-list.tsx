import type { OrderSummary } from "@cartura/contracts/orders";
import { ArrowUpRight, PackageOpen } from "lucide-react";
import Link from "next/link";

import {
  formatAccountDate,
  formatAccountMoney,
  formatOrderStatus,
} from "../lib/account-formatters";

export function OrdersList({ orders }: { orders: OrderSummary[] }) {
  if (!orders.length) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-border bg-muted/35 px-6 py-14 text-center">
        <PackageOpen className="mx-auto size-9 text-muted-foreground" strokeWidth={1.5} />
        <h2 className="mt-4 font-semibold">No orders yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Orders will appear here after you complete checkout.
        </p>
        <Link href="/products" className="mt-5 inline-flex text-sm font-medium hover:underline">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-3">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/settings/orders/${order.id}`}
          className="group grid gap-5 rounded-xl border border-border bg-card p-5 transition hover:border-foreground/20 hover:shadow-[0_16px_48px_color-mix(in_oklch,var(--foreground),transparent_95%)] active:translate-y-px sm:grid-cols-[1fr_auto] sm:items-center sm:p-6"
        >
          <div className="min-w-0">
            <ul className="grid gap-1" aria-label="Items in this order">
              {order.items.map((item) => (
                <li key={item.id} className="truncate font-medium">
                  {item.productName}
                  {item.quantity > 1 ? (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      x{item.quantity}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
            <p className="mt-2 truncate font-mono text-xs text-muted-foreground">
              Order ID {order.orderNumber}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {formatOrderStatus(order.status)}
              </span>
              <p className="text-sm text-muted-foreground">
                {formatAccountDate(order.createdAt)}, {order.items.length}{" "}
                {order.items.length === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-5 sm:justify-end">
            <span className="font-mono font-semibold tabular-nums">
              {formatAccountMoney(order.totalAmount, order.currency)}
            </span>
            <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
          </div>
        </Link>
      ))}
    </div>
  );
}
