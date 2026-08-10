import { httpError } from "../../shared/errors/index.js";
import { notFoundError as sharedNotFoundError } from "../../shared/errors/index.js";

export function cartHttpError(
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): Error {
  return httpError(statusCode, code, message, details);
}

export function productUnavailableError(message = "Product is unavailable") {
  return cartHttpError(409, "PRODUCT_UNAVAILABLE", message);
}

export function cartItemNotFoundError() {
  return sharedNotFoundError("CART_ITEM_NOT_FOUND", "Cart item not found");
}
