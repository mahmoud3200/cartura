import type { AddressResponse } from "@cartura/contracts/addresses";
import type { AuthUser } from "@cartura/contracts/auth";
import type { OrderSummary } from "@cartura/contracts/orders";
import {
  ArrowUpRight,
  CircleUserRound,
  MapPin,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import {
  formatAccountDate,
  formatAccountMoney,
  formatOrderStatus,
  getInitials,
} from "../lib/account-formatters";

const destinations = [
  {
    title: "Personal details",
    description: "Keep your name and contact details current.",
    href: "/settings/profile",
    icon: CircleUserRound,
    className: "md:col-span-7",
  },
  {
    title: "Saved addresses",
    description: "Manage delivery destinations and your default address.",
    href: "/settings/addresses",
    icon: MapPin,
    className: "md:col-span-5",
  },
  {
    title: "Order history",
    description: "Follow payment, fulfillment, and delivery progress.",
    href: "/settings/orders",
    icon: ReceiptText,
    className: "md:col-span-5",
  },
  {
    title: "Sign-in security",
    description: "Review email verification and two-factor protection.",
    href: "/settings/security",
    icon: ShieldCheck,
    className: "md:col-span-7",
  },
];

export function AccountOverview({
  user,
  addresses,
  orders,
}: {
  user: AuthUser;
  addresses: AddressResponse[];
  orders: OrderSummary[];
}) {
  const defaultAddress = addresses.find((address) => address.isDefault);

  return (
    <div className="space-y-8 sm:space-y-12">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card px-5 py-6 sm:px-9 sm:py-10">
        <div className="absolute -right-12 -top-16 size-56 rounded-full bg-accent/45 blur-3xl" aria-hidden="true" />
        <div className="relative flex max-w-5xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-muted-foreground">Your account</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Everything is in one place, {user.firstName}.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Review your details, delivery addresses, order activity, and sign-in protection.
            </p>
          </div>
          <div
            className="grid size-14 shrink-0 place-items-center rounded-xl border border-border bg-secondary text-base font-semibold text-secondary-foreground shadow-[0_18px_50px_color-mix(in_oklch,var(--secondary),transparent_72%)] sm:size-20 sm:rounded-2xl sm:text-xl"
          >
            {getInitials(user.firstName, user.lastName)}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight">Manage your account</h2>
        <div className="mt-5 grid grid-flow-dense grid-cols-1 gap-3 md:grid-cols-12">
          {destinations.map((destination) => {
            const Icon = destination.icon;

            return (
              <Link
                key={destination.href}
                href={destination.href}
                className={`${destination.className} group overflow-hidden rounded-xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[0_18px_55px_color-mix(in_oklch,var(--foreground),transparent_94%)] active:translate-y-0`}
              >
                <div className="flex items-start justify-between gap-6">
                  <span className="grid size-10 place-items-center rounded-lg bg-muted text-foreground transition-transform duration-500 ease-out group-hover:scale-105">
                    <Icon className="size-5" strokeWidth={1.7} />
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                </div>
                <h3 className="mt-5 text-lg font-semibold sm:mt-8">{destination.title}</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  {destination.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

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
            <div className="mt-5 rounded-lg bg-muted/60 p-5">
              <p className="font-medium">No orders yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your purchases will appear here after checkout.
              </p>
            </div>
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
              <strong className="block text-foreground">{defaultAddress.addressName}</strong>
              {defaultAddress.recipientName}
              <br />
              {defaultAddress.streetAddress}
              <br />
              {defaultAddress.area}, {defaultAddress.city}
              <br />
              {defaultAddress.country}
            </address>
          ) : (
            <div className="mt-5 rounded-lg bg-muted/60 p-5">
              <p className="font-medium">No default address</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Save one to make checkout faster.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
