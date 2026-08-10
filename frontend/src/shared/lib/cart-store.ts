import type { Cart } from "@cartura/contracts/cart";
import { createStore } from "zustand/vanilla";

export type CartStoreState = {
  cart: Cart | null;
};

export type CartStoreActions = {
  setCart: (cart: Cart) => void;
  clearCart: () => void;
};

export type CartStore = CartStoreState & CartStoreActions;

export function createCartStore(initialCart: Cart | null = null) {
  return createStore<CartStore>()((set) => ({
    cart: initialCart,
    setCart: (cart) =>
      set((state) => (state.cart === cart ? state : { cart })),
    clearCart: () => set({ cart: null }),
  }));
}

export type CartStoreApi = ReturnType<typeof createCartStore>;
