"use client";

import type { AddressResponse } from "@cartura/contracts/addresses";
import type { Cart } from "@cartura/contracts/cart";
import type { PaymentMethod } from "@cartura/contracts/orders";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useCart } from "../hooks/use-cart";
import { CartCheckoutPanel } from "../ui/cart-checkout-panel";
import { CartEmptyState } from "../ui/cart-empty-state";
import { CartLineItem } from "../ui/cart-line-item";

export function CartPage({
  initialCart,
  addresses,
}: {
  initialCart: Cart;
  addresses: AddressResponse[];
}) {
  const cartState = useCart(initialCart);
  const [selectedAddressId, setSelectedAddressId] = useState(
    addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id ?? "",
  );
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash_on_delivery");

  return (
    <main className="min-h-[70dvh] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Continue shopping
        </Link>
        <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Customer checkout
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Your cart
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {cartState.cart.itemCount} {cartState.cart.itemCount === 1 ? "item" : "items"}
          </p>
        </div>

        {cartState.error ? (
          <p
            role="alert"
            className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {cartState.error}
          </p>
        ) : null}

        {cartState.cart.items.length === 0 ? (
          <div className="mt-10">
            <CartEmptyState />
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start">
            <section className="space-y-3" aria-label="Cart items">
              {cartState.cart.items.map((item) => (
                <CartLineItem
                  key={item.productId}
                  item={item}
                  isPending={cartState.pendingProductId === item.productId}
                  onQuantityChange={(quantity) =>
                    cartState.updateQuantity(item.productId, quantity)
                  }
                  onRemove={() => cartState.removeItem(item.productId)}
                />
              ))}
            </section>
            <CartCheckoutPanel
              subtotal={cartState.cart.subtotal}
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              notes={notes}
              paymentMethod={paymentMethod}
              isPending={cartState.isCheckoutPending}
              onAddressChange={setSelectedAddressId}
              onNotesChange={setNotes}
              onPaymentMethodChange={setPaymentMethod}
              onCheckout={() =>
                cartState.checkout(selectedAddressId, paymentMethod, notes)
              }
            />
          </div>
        )}
      </div>
    </main>
  );
}
