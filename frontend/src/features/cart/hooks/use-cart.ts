"use client";

import type { Cart } from "@cartura/contracts/cart";
import type { PaymentMethod } from "@cartura/contracts/orders";
import { useEffect, useRef, useState } from "react";

import { useCartStore } from "@/shared/components/cart-store-provider";

import {
  checkoutCartAction,
  removeCartItemAction,
  updateCartItemAction,
} from "../actions";

export function useCart(initialCart: Cart) {
  const storedCart = useCartStore((state) => state.cart);
  const setCart = useCartStore((state) => state.setCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const [error, setError] = useState<string>();
  const [pendingProductId, setPendingProductId] = useState<string>();
  const [isCheckoutPending, setIsCheckoutPending] = useState(false);
  const checkoutKey = useRef<string | undefined>(undefined);
  const isCheckoutSubmitting = useRef(false);
  const cart = storedCart?.userId === initialCart.userId ? storedCart : initialCart;

  useEffect(() => {
    setCart(initialCart);
  }, [initialCart, setCart]);

  async function updateQuantity(productId: string, quantity: number) {
    setPendingProductId(productId);
    setError(undefined);

    try {
      const result = await updateCartItemAction({ productId, quantity });

      if (result.ok) {
        setCart(result.data);
      } else {
        setError(result.message);
      }
    } finally {
      setPendingProductId(undefined);
    }
  }

  async function removeItem(productId: string) {
    setPendingProductId(productId);
    setError(undefined);

    try {
      const result = await removeCartItemAction(productId);

      if (result.ok) {
        setCart(result.data);
      } else {
        setError(result.message);
      }
    } finally {
      setPendingProductId(undefined);
    }
  }

  async function checkout(
    addressId: string,
    paymentMethod: PaymentMethod,
    notes?: string,
  ) {
    if (isCheckoutSubmitting.current) return;

    isCheckoutSubmitting.current = true;
    setIsCheckoutPending(true);
    setError(undefined);
    checkoutKey.current ??= globalThis.crypto.randomUUID();

    try {
      const result = await checkoutCartAction({
        addressId,
        paymentMethod,
        idempotencyKey: checkoutKey.current,
        notes: notes || undefined,
      });

      if (result.ok) {
        clearCart();
        window.location.assign(
          result.data.checkoutUrl ??
            `/settings/orders/${encodeURIComponent(result.data.orderId)}?placed=1`,
        );
        return;
      }

      checkoutKey.current = undefined;
      isCheckoutSubmitting.current = false;
      setError(result.message);
      setIsCheckoutPending(false);
    } catch (err) {
      isCheckoutSubmitting.current = false;
      setIsCheckoutPending(false);
      throw err;
    }
  }

  return {
    cart,
    error,
    pendingProductId,
    isCheckoutPending,
    updateQuantity,
    removeItem,
    checkout,
  };
}
