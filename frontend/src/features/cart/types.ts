import type { Cart } from "@cartura/contracts/cart";
import type { ActionRateLimitMetadata } from "@/shared/types";

export type CartActionResult<T> =
  | { ok: true; data: T }
  | ({ ok: false; message: string; requiresAuthentication?: boolean } &
      ActionRateLimitMetadata);

export type CartMutationResult = CartActionResult<Cart>;
