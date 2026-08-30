import type { OrderSummary } from "@cartura/contracts/orders";
import type { CustomerRefund } from "@cartura/contracts/refunds";
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  MessageSquareText,
  Package,
  ReceiptText,
} from "lucide-react";
import Link from "next/link";

import {
  formatAccountDate,
  formatAccountMoney,
  formatOrderStatus,
} from "../lib/account-formatters";
import { OrderReturnPanel } from "./order-return-panel";

export function OrderDetail({
  order,
  refunds,
}: {
  order: OrderSummary;
  refunds: CustomerRefund[];
}) {
  return (
    <div>
      <Link href="/settings/orders" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to orders
      </Link>
      <header className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-sm text-muted-foreground">{order.orderNumber}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Order details</h1>
          <p className="mt-3 text-sm text-muted-foreground">Placed {formatAccountDate(order.createdAt)}</p>
        </div>
        <div className="w-fit rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground">
          {formatOrderStatus(order.status)}
        </div>
      </header>

      <div className="mt-8 grid gap-5 xl:grid-cols-[1.35fr_0.8fr]">
        <section className="rounded-xl border border-border bg-card p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <Package className="size-5" strokeWidth={1.7} />
            <h2 className="text-lg font-semibold">Items</h2>
          </div>
          <div className="mt-5 space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_auto] gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.productSku} · Quantity {item.quantity}
                  </p>
                </div>
                <p className="font-mono text-sm font-medium tabular-nums">
                  {formatAccountMoney(item.totalPrice, order.currency)}
                </p>
              </div>
            ))}
          </div>
          <dl className="mt-7 space-y-3 border-t border-border pt-5 text-sm">
            <MoneyRow label="Subtotal" value={order.subtotal} currency={order.currency} />
            <MoneyRow label="Shipping" value={order.shippingCost} currency={order.currency} />
            {order.discountAmount > 0 ? <MoneyRow label="Discount" value={-order.discountAmount} currency={order.currency} /> : null}
            <div className="flex items-center justify-between gap-4 pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd className="font-mono tabular-nums">{formatAccountMoney(order.totalAmount, order.currency)}</dd>
            </div>
          </dl>
        </section>

        <div className="space-y-5">
          <OrderReturnPanel order={order} refunds={refunds} />
          {order.notes ? (
            <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <MessageSquareText className="size-5" strokeWidth={1.7} />
                <h2 className="font-semibold">Order note</h2>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {order.notes}
              </p>
            </section>
          ) : null}

          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <MapPin className="size-5" strokeWidth={1.7} />
              <h2 className="font-semibold">Delivery address</h2>
            </div>
            {order.address ? (
              <address className="mt-4 text-sm not-italic leading-6 text-muted-foreground">
                <span className="text-foreground">{order.address.recipientName}</span>
                <br />
                {order.address.streetAddress}
                <br />
                {order.address.area}, {order.address.city}
                <br />
                {order.address.country}{order.address.postalCode ? ` ${order.address.postalCode}` : ""}
                <br />
                {order.address.phoneNumber}
              </address>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No delivery address is attached.</p>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <ReceiptText className="size-5" strokeWidth={1.7} />
              <h2 className="font-semibold">Payment</h2>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">{formatOrderStatus(order.payment?.status ?? "not available")}</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Method</span>
              <span className="font-medium">
                {order.payment?.paymentMethod === "cash_on_delivery"
                  ? "Cash on delivery"
                  : "Card"}
              </span>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5" strokeWidth={1.7} />
              <h2 className="font-semibold">Progress</h2>
            </div>
            <ol className="mt-5 space-y-4">
              {order.statusHistory.map((event) => (
                <li key={event.id} className="grid grid-cols-[0.5rem_1fr] gap-3">
                  <span className="mt-1.5 size-2 rounded-full bg-primary" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium">{formatOrderStatus(event.newStatus)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatAccountDate(event.createdAt)}</p>
                    {event.note ? <p className="mt-2 text-sm leading-5 text-muted-foreground">{event.note}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

function MoneyRow({ label, value, currency }: { label: string; value: number; currency: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-muted-foreground">
      <dt>{label}</dt>
      <dd className="font-mono tabular-nums text-foreground">{formatAccountMoney(value, currency)}</dd>
    </div>
  );
}
