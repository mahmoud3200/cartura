"use client";

import type { AddressResponse } from "@cartura/contracts/addresses";
import type { PaymentMethod } from "@cartura/contracts/orders";
import { Banknote, CreditCard, MapPin, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { formatPrice } from "@/features/storefront/products/ui/product-card";
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

type BuyNowSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productPrice: number;
  addresses: AddressResponse[];
  isPending: boolean;
  onConfirm: (
    addressId: string,
    paymentMethod: PaymentMethod,
    notes: string,
  ) => void;
};

export function BuyNowSheet({
  isOpen,
  onClose,
  productName,
  productPrice,
  addresses,
  isPending,
  onConfirm,
}: BuyNowSheetProps) {
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash_on_delivery");
  const [notes, setNotes] = useState("");
  const effectiveAddressId =
    addresses.some((address) => address.id === selectedAddressId)
      ? selectedAddressId
      : addresses.find((address) => address.isDefault)?.id ??
        addresses[0]?.id ??
        "";
  const selectedAddress = addresses.find(
    (address) => address.id === effectiveAddressId,
  );

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto border-l border-border bg-background p-6 shadow-lg sm:max-w-md">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Buy now</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={onClose}
          >
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <div className="mt-8 flex flex-col gap-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-medium">{productName}</h3>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {formatPrice(productPrice)}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">Quantity: 1</p>
          </div>

          <div className="border-t border-border pt-6">
            <div className="flex items-center gap-2">
              <MapPin className="size-4" />
              <h3 className="text-sm font-semibold">Delivery address</h3>
            </div>
            {addresses.length > 0 ? (
              <Select
                value={effectiveAddressId}
                onValueChange={(value) => value && setSelectedAddressId(value)}
              >
                <SelectTrigger className="mt-4 h-11">
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
              <div className="mt-4 rounded-lg border border-dashed border-border p-4 text-sm">
                <p className="text-muted-foreground">
                  Add a delivery address before placing your order.
                </p>
                <Link
                  href="/settings/addresses"
                  className="mt-2 inline-flex font-medium underline underline-offset-4"
                  onClick={onClose}
                >
                  Add delivery address
                </Link>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-6">
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
                value && setPaymentMethod(value as PaymentMethod)
              }
            >
              <SelectTrigger className="mt-4 h-11">
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

          <div className="border-t border-border pt-6">
            <label className="block text-sm font-medium" htmlFor="buy-now-notes">
              Order notes <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="buy-now-notes"
              value={notes}
              maxLength={500}
              rows={3}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Delivery instructions"
              className="mt-3 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="mt-4 border-t border-border pt-6">
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span className="font-mono text-lg tabular-nums">
                {formatPrice(productPrice)}
              </span>
            </div>
            <Button
              type="button"
              className="mt-6 h-11 w-full"
              disabled={!effectiveAddressId || isPending}
              onClick={() =>
                onConfirm(effectiveAddressId, paymentMethod, notes)
              }
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
                  : "Confirm and pay"}
            </Button>
            <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
              {paymentMethod === "cash_on_delivery"
                ? "Pay the courier when your order arrives."
                : "You will continue to Paymob to complete card payment securely."}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function formatAddressOption(address: AddressResponse) {
  return `${address.addressName}${address.isDefault ? " (default)" : ""} - ${address.area}, ${address.city}`;
}
