"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";

import {
  createCartStore,
  type CartStore,
  type CartStoreApi,
} from "@/shared/lib/cart-store";

const CartStoreContext = createContext<CartStoreApi | null>(null);

export function CartStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createCartStore);

  return (
    <CartStoreContext.Provider value={store}>
      {children}
    </CartStoreContext.Provider>
  );
}

export function useCartStore<T>(selector: (store: CartStore) => T): T {
  const store = useContext(CartStoreContext);

  if (!store) {
    throw new Error("useCartStore must be used within CartStoreProvider");
  }

  return useStore(store, selector);
}
