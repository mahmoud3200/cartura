import { conflictError, notFoundError } from "../../shared/errors/index.js";

export function productUnavailableError(message = "Product is unavailable") {
  return conflictError("PRODUCT_UNAVAILABLE", message);
}

export function cartItemNotFoundError() {
  return notFoundError("CART_ITEM_NOT_FOUND", "Cart item not found");
}

export function cartConcurrentModificationError() {
  return conflictError(
    "CART_CONCURRENT_MODIFICATION",
    "The cart changed during this request; please retry",
  );
}
