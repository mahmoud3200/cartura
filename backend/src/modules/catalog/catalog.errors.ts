export function catalogHttpError(
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

export function notFoundError(resource: string): Error {
  return catalogHttpError(404, "CATALOG_NOT_FOUND", `${resource} not found`);
}

export function conflictError(message: string): Error {
  return catalogHttpError(409, "CATALOG_CONFLICT", message);
}
