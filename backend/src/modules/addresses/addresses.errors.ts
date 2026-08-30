import { conflictError, notFoundError } from "../../shared/errors/index.js";

export function addressNotFoundError(): Error {
  return notFoundError("ADDRESS_NOT_FOUND", "Address not found");
}

export function addressLimitExceededError(): Error {
  return conflictError(
    "ADDRESS_LIMIT_EXCEEDED",
    "A user can have at most 20 addresses",
  );
}
