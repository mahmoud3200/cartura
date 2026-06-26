import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  _next,
) => {
  const httpError = toHttpError(error);

  if (httpError) {
    res.status(httpError.statusCode).json({
      error: {
        code: httpError.code,
        message: httpError.message,
        details: httpError.details,
      },
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    },
  });
};

type HttpErrorShape = {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
};

function toHttpError(error: unknown): HttpErrorShape | null {
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
