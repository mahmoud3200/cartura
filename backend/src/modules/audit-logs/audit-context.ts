import type { Request } from "express";

import { getRequestContext } from "../../shared/middleware/request-context.js";
import { getOptionalAuthenticatedUserId } from "../../shared/utils/request.utils.js";
import type { AuditContext } from "./audit-logs.types.js";

export function getAuditContext(req: Request): AuditContext {
  const requestContext = getRequestContext(req);
  const userId = getOptionalAuthenticatedUserId(req);

  return {
    actorUserId: userId,
    actorType: userId ? "user" : "system",
    requestId: requestContext.requestId,
    ipAddress: requestContext.ipAddress,
    userAgent: requestContext.userAgent,
  };
}
