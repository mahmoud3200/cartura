import type { ApiErrorResponse } from "@cartura/contracts/common";
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
    const response = {
      error: {
        code: httpError.code,
        message: httpError.message,
        requestId,
        ...(httpError.details === undefined
          ? {}
          : { details: httpError.details }),
      },
    } satisfies ApiErrorResponse;

    res.status(httpError.statusCode).json(response);
    return;
  }

  console.error("Unhandled request error", {
    requestId,
    method: req.method,
    path: req.originalUrl,
    error,
  });

  const response = {
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
      requestId,
    },
  } satisfies ApiErrorResponse;

  res.status(500).json(response);
};
