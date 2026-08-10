"use client";

import type { Cart } from "@cartura/contracts/cart";
import { useEffect } from "react";

import { useCartStore } from "./cart-store-provider";

export function CartStoreHydrator({ cart }: { cart: Cart | null }) {
  const setCart = useCartStore((state) => state.setCart);
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    if (cart) {
      setCart(cart);
    } else {
      clearCart();
    }
  }, [cart, clearCart, setCart]);

  return null;
}
