import { conflictError, httpError, notFoundError } from "../../shared/errors/index.js";

export function addressNotFoundError(): Error {
  return notFoundError("ADDRESS_NOT_FOUND", "Address not found");
}

export function addressLimitExceededError(): Error {
  return conflictError(
    "ADDRESS_LIMIT_EXCEEDED",
    "A user can have at most 20 addresses",
  );
}

export function addressHttpError(
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): Error {
  return httpError(statusCode, code, message, details);
}
