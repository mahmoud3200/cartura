import type { ErrorRequestHandler } from "express";
import { toHttpError } from "../errors/index.js";
import { getRequestContext } from "./request-context.js";

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  req,
  res,
  _next,
) => {
  const httpError = toHttpError(error);
  const requestId = getRequestContext(req).requestId;

  if (httpError) {
    res.status(httpError.statusCode).json({
      error: {
        code: httpError.code,
        message: httpError.message,
        details: httpError.details,
        requestId,
      },
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: error instanceof Error ? `Unexpected error: ${error.message} - ${error.stack}` : "An unexpected error occurred",
      requestId,
    },
  });
};
