export function cartHttpError(
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): Error {
  return Object.assign(new Error(message), {
    statusCode,
    code,
    details,
  });
}

export function productUnavailableError(message = "Product is unavailable") {
  return cartHttpError(409, "PRODUCT_UNAVAILABLE", message);
}

export function cartItemNotFoundError() {
  return cartHttpError(404, "CART_ITEM_NOT_FOUND", "Cart item not found");
}
