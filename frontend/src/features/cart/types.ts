import type { Cart } from "@cartura/contracts/cart";

export type CartActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; requiresAuthentication?: boolean };

export type CartMutationResult = CartActionResult<Cart>;

