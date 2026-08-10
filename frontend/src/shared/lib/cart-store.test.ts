import type { Cart } from "@cartura/contracts/cart";
import { describe, expect, it } from "vitest";

import { createCartStore } from "./cart-store";

const emptyCart: Cart = {
  id: "cart-1",
  userId: "user-1",
  subtotal: 0,
  itemCount: 0,
  uniqueItemCount: 0,
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
  items: [],
};

describe("cart store", () => {
  it("shares the latest cart even when the cart timestamp is unchanged", () => {
    const store = createCartStore(emptyCart);
    const updatedCart = {
      ...emptyCart,
      itemCount: 2,
      uniqueItemCount: 1,
      subtotal: 300,
    };

    store.getState().setCart(updatedCart);

    expect(store.getState().cart).toBe(updatedCart);
    expect(store.getState().cart?.itemCount).toBe(2);
  });

  it("clears customer cart state after checkout or sign-out", () => {
    const store = createCartStore(emptyCart);

    store.getState().clearCart();

    expect(store.getState().cart).toBeNull();
  });
});
