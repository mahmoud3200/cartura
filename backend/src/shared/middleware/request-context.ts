import { randomUUID } from "node:crypto";
import type { Request, RequestHandler } from "express";

export type RequestContext = {
  requestId: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
};

export type RequestWithContext = Request & {
  requestContext?: RequestContext;
};

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

export const requestContext: RequestHandler = (req, res, next) => {
  const requestId = getRequestId(req);

  (req as RequestWithContext).requestContext = {
    requestId,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  };

  res.setHeader("X-Request-Id", requestId);
  next();
};

export function getRequestContext(req: Request): RequestContext {
  const requestWithContext = req as RequestWithContext;

  if (!requestWithContext.requestContext) {
    requestWithContext.requestContext = {
      requestId: randomUUID(),
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    };
  }

  return requestWithContext.requestContext;
}

function getRequestId(req: Request): string {
  const header = req.get("x-request-id");

  if (header && REQUEST_ID_PATTERN.test(header)) {
    return header;
  }

  return randomUUID();
}
