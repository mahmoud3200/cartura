import { conflictError as sharedConflictError, httpError } from "../../shared/errors/index.js";

export function catalogHttpError(
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): Error {
  return httpError(statusCode, code, message, details);
}

export function notFoundError(resource: string): Error {
  return catalogHttpError(404, "CATALOG_NOT_FOUND", `${resource} not found`);
}

export function conflictError(message: string): Error {
  return sharedConflictError("CATALOG_CONFLICT", message);
}
