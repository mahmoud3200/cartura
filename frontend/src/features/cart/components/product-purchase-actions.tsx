"use client";

import { CreditCard, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import type { AddressResponse } from "@cartura/contracts/addresses";
import type { PaymentMethod } from "@cartura/contracts/orders";

import { useCartStore } from "@/shared/components/cart-store-provider";
import { Button } from "@/shared/ui/button";

import { addCartItemAction } from "../actions";
import { buyNowAction } from "../actions/buy-now.action";
import { BuyNowSheet } from "../ui/buy-now-sheet";

type PurchaseIntent = "add" | "buy";

export function ProductPurchaseActions({
  productId,
  productSlug,
  productName,
  productPrice,
  stockQuantity,
  isAuthenticated,
  addresses,
}: {
  productId: string;
  productSlug: string;
  productName: string;
  productPrice: number;
  stockQuantity: number;
  isAuthenticated: boolean;
  addresses?: AddressResponse[];
}) {
  const router = useRouter();
  const setCart = useCartStore((state) => state.setCart);
  const [pendingIntent, setPendingIntent] = useState<PurchaseIntent>();
  const [isBuyNowOpen, setIsBuyNowOpen] = useState(false);
  const buyNowCheckoutKey = useRef<string | undefined>(undefined);
  const isBuyNowSubmitting = useRef(false);
  const redirectPath = `/products/${encodeURIComponent(productSlug)}`;
  const loginHref = `/auth/login?redirect=${encodeURIComponent(redirectPath)}`;
  const isOutOfStock = stockQuantity === 0;

  if (!isAuthenticated) {
    return (
      <div className="mt-8 grid gap-2 sm:grid-cols-2">
        <Button
          nativeButton={false}
          render={<Link href={loginHref} />}
          variant="outline"
          className="h-11 w-full"
          disabled={isOutOfStock}
        >
          <ShoppingCart className="size-4" />
          {isOutOfStock ? "Out of stock" : "Sign in to add"}
        </Button>
        <Button
          nativeButton={false}
          render={<Link href={loginHref} />}
          className="h-11 w-full"
          disabled={isOutOfStock}
        >
          <CreditCard className="size-4" />
          {isOutOfStock ? "Unavailable" : "Sign in to buy"}
        </Button>
      </div>
    );
  }

  async function addProduct(intent: PurchaseIntent) {
    setPendingIntent(intent);

    try {
      const result = await addCartItemAction({ productId, quantity: 1 });

      if (!result.ok) {
        if (result.requiresAuthentication) {
          router.push(loginHref);
          return;
        }

        toast.error("Could not update your cart", {
          description: result.message,
        });
        return;
      }

      setCart(result.data);

      toast.success(`${productName} added to your cart`, {
        description: `${result.data.itemCount} ${result.data.itemCount === 1 ? "item" : "items"} ready for checkout.`,
      });
    } catch (error) {
      toast.error("Could not update your cart", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setPendingIntent(undefined);
    }
  }

  async function handleBuyNow(
    addressId: string,
    paymentMethod: PaymentMethod,
    notes: string,
  ) {
    if (isBuyNowSubmitting.current) return;

    isBuyNowSubmitting.current = true;
    buyNowCheckoutKey.current ??= globalThis.crypto.randomUUID();
    setPendingIntent("buy");

    try {
      const result = await buyNowAction({
        productId,
        quantity: 1,
        addressId,
        paymentMethod,
        idempotencyKey: buyNowCheckoutKey.current,
        notes: notes || undefined,
      });

      if (!result.ok) {
        buyNowCheckoutKey.current = undefined;
        isBuyNowSubmitting.current = false;
        setPendingIntent(undefined);
        toast.error("Could not complete purchase", {
          description: result.message,
        });
        return;
      }

      window.location.assign(
        result.data.checkoutUrl ??
          `/settings/orders/${encodeURIComponent(result.data.orderId)}?placed=1`,
      );
    } catch (error) {
      buyNowCheckoutKey.current = undefined;
      isBuyNowSubmitting.current = false;
      toast.error("Could not complete purchase", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
      setPendingIntent(undefined);
    }
  }

  return (
    <div className="mt-8 grid gap-2 sm:grid-cols-2">
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full"
        disabled={isOutOfStock || pendingIntent !== undefined}
        onClick={() => addProduct("add")}
      >
        <ShoppingCart className="size-4" />
        {isOutOfStock
          ? "Out of stock"
          : pendingIntent === "add"
            ? "Adding..."
            : "Add to cart"}
      </Button>
      <Button
        type="button"
        className="h-11 w-full"
        disabled={isOutOfStock || pendingIntent !== undefined}
        onClick={() => setIsBuyNowOpen(true)}
      >
        <CreditCard className="size-4" />
        {isOutOfStock
          ? "Unavailable"
          : pendingIntent === "buy"
            ? "Preparing..."
            : "Buy now"}
      </Button>

      {isAuthenticated && addresses && (
        <BuyNowSheet
          isOpen={isBuyNowOpen}
          onClose={() => setIsBuyNowOpen(false)}
          productName={productName}
          productPrice={productPrice}
          addresses={addresses}
          isPending={pendingIntent === "buy"}
          onConfirm={handleBuyNow}
        />
      )}
    </div>
  );
}
