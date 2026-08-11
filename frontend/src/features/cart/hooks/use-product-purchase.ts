"use client";

import type { PaymentMethod } from "@cartura/contracts/orders";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { useCartStore } from "@/shared/components/cart-store-provider";

import { addCartItemAction } from "../actions";
import { buyNowAction } from "../actions/buy-now.action";

type PurchaseIntent = "add" | "buy";

export function useProductPurchase({
  productId,
  productSlug,
  productName,
}: {
  productId: string;
  productSlug: string;
  productName: string;
}) {
  const router = useRouter();
  const setCart = useCartStore((state) => state.setCart);
  const [pendingIntent, setPendingIntent] = useState<PurchaseIntent>();
  const [isBuyNowOpen, setIsBuyNowOpen] = useState(false);
  const buyNowCheckoutKey = useRef<string | undefined>(undefined);
  const isBuyNowSubmitting = useRef(false);
  const redirectPath = `/products/${encodeURIComponent(productSlug)}`;
  const loginHref = `/auth/login?redirect=${encodeURIComponent(redirectPath)}`;

  async function addToCart() {
    setPendingIntent("add");

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

  async function buyNow(
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
      setPendingIntent(undefined);
      toast.error("Could not complete purchase", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  return {
    addToCart,
    buyNow,
    closeBuyNow: () => setIsBuyNowOpen(false),
    isAddingToCart: pendingIntent === "add",
    isBuyingNow: pendingIntent === "buy",
    isBuyNowOpen,
    isPending: pendingIntent !== undefined,
    loginHref,
    openBuyNow: () => setIsBuyNowOpen(true),
  };
}
