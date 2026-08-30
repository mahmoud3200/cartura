import assert from "node:assert/strict";
import test from "node:test";
import type { NextFunction, Request, Response } from "express";

import { httpError } from "../errors/index.js";
import { errorHandler } from "./error-handler.js";
import type { RequestWithContext } from "./request-context.js";

function createRequest(): Request {
  return {
    method: "GET",
    originalUrl: "/failure",
    requestContext: { requestId: "request-123" },
  } as RequestWithContext;
}

function createResponse() {
  let statusCode = 0;
  let payload: unknown;
  const response = {
    status(code: number) {
      statusCode = code;
      return response;
    },
    json(value: unknown) {
      payload = value;
      return response;
    },
  } as unknown as Response;

  return {
    response,
    result: () => ({ statusCode, payload }),
  };
}

const next = (() => undefined) as NextFunction;

test("known HTTP errors preserve their safe transport details", () => {
  const { response, result } = createResponse();

  errorHandler(
    httpError(409, "CONFLICT", "Conflict", { field: "email" }),
    createRequest(),
    response,
    next,
  );

  assert.deepEqual(result(), {
    statusCode: 409,
    payload: {
      error: {
        code: "CONFLICT",
        message: "Conflict",
        details: { field: "email" },
        requestId: "request-123",
      },
    },
  });
});

test("unexpected errors never expose messages or stacks", () => {
  const { response, result } = createResponse();
  const originalConsoleError = console.error;
  console.error = () => undefined;

  try {
    errorHandler(
      new Error("database password leaked"),
      createRequest(),
      response,
      next,
    );
  } finally {
    console.error = originalConsoleError;
  }

  assert.deepEqual(result(), {
    statusCode: 500,
    payload: {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
        requestId: "request-123",
      },
    },
  });
});
