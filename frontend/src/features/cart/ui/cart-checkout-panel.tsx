import type { AddressResponse } from "@cartura/contracts/addresses";
import type { PaymentMethod } from "@cartura/contracts/orders";
import { Banknote, CreditCard, MapPin } from "lucide-react";
import Link from "next/link";

import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import { formatCartMoney } from "../lib/cart-formatters";

type CartCheckoutPanelProps = {
  subtotal: number;
  addresses: AddressResponse[];
  selectedAddressId: string;
  paymentMethod: PaymentMethod;
  notes: string;
  isPending: boolean;
  onAddressChange: (addressId: string) => void;
  onPaymentMethodChange: (paymentMethod: PaymentMethod) => void;
  onNotesChange: (notes: string) => void;
  onCheckout: () => void;
};

export function CartCheckoutPanel({
  subtotal,
  addresses,
  selectedAddressId,
  paymentMethod,
  notes,
  isPending,
  onAddressChange,
  onPaymentMethodChange,
  onNotesChange,
  onCheckout,
}: CartCheckoutPanelProps) {
  const selectedAddress = addresses.find(
    (address) => address.id === selectedAddressId,
  );

  return (
    <aside
      id="checkout"
      className="scroll-mt-24 rounded-xl border border-border bg-card p-5 target:border-foreground/40 target:ring-3 target:ring-ring/20 sm:p-6 lg:sticky lg:top-24"
    >
      <h2 className="text-lg font-semibold">Order summary</h2>
      <dl className="mt-5 space-y-3 border-b border-border pb-5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-mono tabular-nums">
            {formatCartMoney(subtotal)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Shipping</dt>
          <dd>Free</dd>
        </div>
      </dl>
      <div className="flex items-center justify-between gap-4 py-5 font-semibold">
        <span>Total</span>
        <span className="font-mono text-lg tabular-nums">
          {formatCartMoney(subtotal)}
        </span>
      </div>

      <div className="border-t border-border pt-5">
        <div className="flex items-center gap-2">
          <MapPin className="size-4" />
          <h3 className="text-sm font-semibold">Delivery address</h3>
        </div>
        {addresses.length ? (
          <Select
            value={selectedAddressId}
            onValueChange={(value) => value && onAddressChange(value)}
          >
            <SelectTrigger className="mt-3 h-11">
              <SelectValue>
                {() =>
                  selectedAddress
                    ? formatAddressOption(selectedAddress)
                    : "Choose a delivery address"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPortal>
              <SelectPositioner>
                <SelectPopup>
                  <SelectList>
                    {addresses.map((address) => (
                      <SelectItem key={address.id} value={address.id}>
                        {formatAddressOption(address)}
                      </SelectItem>
                    ))}
                  </SelectList>
                </SelectPopup>
              </SelectPositioner>
            </SelectPortal>
          </Select>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-border p-4 text-sm">
            <p className="text-muted-foreground">
              Add a delivery address before placing your order.
            </p>
            <Link
              href="/settings/addresses"
              className="mt-2 inline-flex font-medium underline underline-offset-4"
            >
              Add delivery address
            </Link>
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-border pt-5">
        <div className="flex items-center gap-2">
          {paymentMethod === "cash_on_delivery" ? (
            <Banknote className="size-4" />
          ) : (
            <CreditCard className="size-4" />
          )}
          <h3 className="text-sm font-semibold">Payment method</h3>
        </div>
        <Select
          value={paymentMethod}
          onValueChange={(value) =>
            value && onPaymentMethodChange(value as PaymentMethod)
          }
        >
          <SelectTrigger className="mt-3 h-11">
            <SelectValue>
              {() =>
                paymentMethod === "cash_on_delivery"
                  ? "Cash on delivery"
                  : "Card with Paymob"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectPortal>
            <SelectPositioner>
              <SelectPopup>
                <SelectList>
                  <SelectItem value="cash_on_delivery">
                    Cash on delivery
                  </SelectItem>
                  <SelectItem value="card">Card with Paymob</SelectItem>
                </SelectList>
              </SelectPopup>
            </SelectPositioner>
          </SelectPortal>
        </Select>
      </div>

      <label className="mt-5 block text-sm font-medium" htmlFor="order-notes">
        Order notes <span className="text-muted-foreground">(optional)</span>
      </label>
      <textarea
        id="order-notes"
        value={notes}
        maxLength={500}
        rows={3}
        onChange={(event) => onNotesChange(event.target.value)}
        placeholder="Delivery instructions"
        className="mt-2 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />

      <Button
        type="button"
        className="mt-5 h-11 w-full"
        disabled={!selectedAddressId || isPending}
        onClick={onCheckout}
      >
        {paymentMethod === "cash_on_delivery" ? (
          <Banknote className="size-4" />
        ) : (
          <CreditCard className="size-4" />
        )}
        {isPending
          ? "Placing order..."
          : paymentMethod === "cash_on_delivery"
            ? "Place cash order"
            : "Place order and pay"}
      </Button>
      <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
        {paymentMethod === "cash_on_delivery"
          ? "Pay the courier when your order arrives."
          : "You will continue to Paymob to complete card payment securely."}
      </p>
    </aside>
  );
}

function formatAddressOption(address: AddressResponse) {
  return `${address.addressName}${address.isDefault ? " (default)" : ""} - ${address.area}, ${address.city}`;
}
