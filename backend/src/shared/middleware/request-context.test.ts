import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response } from "express";

import {
  getRequestContext,
  requestContext,
} from "./request-context.js";

function createRequest(requestId?: string): Request {
  return {
    ip: "127.0.0.1",
    get(name: string) {
      if (name.toLowerCase() === "x-request-id") {
        return requestId;
      }

      return undefined;
    },
  } as Request;
}

test("request context accepts a safe caller request ID", () => {
  const req = createRequest("trace-123:span_456");
  let responseRequestId = "";
  const res = {
    setHeader(_name: string, value: string) {
      responseRequestId = value;
    },
  } as unknown as Response;

  requestContext(req, res, () => undefined);

  assert.equal(getRequestContext(req).requestId, "trace-123:span_456");
  assert.equal(responseRequestId, "trace-123:span_456");
});

test("request context replaces unsafe header values", () => {
  const req = createRequest("unsafe\r\nheader: injected");
  const res = { setHeader() {} } as unknown as Response;

  requestContext(req, res, () => undefined);

  assert.match(
    getRequestContext(req).requestId,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
});

test("fallback request context remains stable for a request", () => {
  const req = createRequest();

  assert.equal(
    getRequestContext(req).requestId,
    getRequestContext(req).requestId,
  );
});
