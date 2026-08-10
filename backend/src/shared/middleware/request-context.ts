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
  return (
    (req as RequestWithContext).requestContext ?? {
      requestId: randomUUID(),
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    }
  );
}

function getRequestId(req: Request): string {
  const header = req.get("x-request-id");

  if (header && header.length <= 200) {
    return header;
  }

  return randomUUID();
}
