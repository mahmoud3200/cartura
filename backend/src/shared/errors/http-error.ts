export type HttpError = Error & {
  statusCode: number;
  code: string;
  details?: unknown;
};

export type HttpErrorShape = {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
};

export function httpError(
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  error.code = code;

  if (details !== undefined) {
    error.details = details;
  }

  return error;
}

export function validationError(details?: unknown): HttpError {
  return httpError(400, "VALIDATION_ERROR", "Request validation failed", details);
}

export function unauthenticatedError(
  message = "Authentication is required",
): HttpError {
  return httpError(401, "UNAUTHENTICATED", message);
}

export function forbiddenError(
  message = "You do not have permission to perform this action",
  details?: unknown,
): HttpError {
  return httpError(403, "FORBIDDEN", message, details);
}

export function notFoundError(
  code: string,
  message: string,
  details?: unknown,
): HttpError {
  return httpError(404, code, message, details);
}

export function conflictError(
  code: string,
  message: string,
  details?: unknown,
): HttpError {
  return httpError(409, code, message, details);
}

export function routeNotFoundError(method: string, url: string): HttpError {
  return notFoundError("ROUTE_NOT_FOUND", `Cannot ${method} ${url}`);
}

export function toHttpError(error: unknown): HttpErrorShape | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const maybeError = error as {
    status?: unknown;
    statusCode?: unknown;
    code?: unknown;
    message?: unknown;
    details?: unknown;
  };
  const statusCode =
    typeof maybeError.statusCode === "number"
      ? maybeError.statusCode
      : typeof maybeError.status === "number"
        ? maybeError.status
        : null;

  if (!statusCode || statusCode < 400 || statusCode > 599) {
    return null;
  }

  return {
    statusCode,
    code: typeof maybeError.code === "string" ? maybeError.code : "HTTP_ERROR",
    message:
      typeof maybeError.message === "string"
        ? maybeError.message
        : "Request failed",
    details: maybeError.details,
  };
}
