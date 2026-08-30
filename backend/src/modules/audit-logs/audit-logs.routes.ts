import { Router } from "express";
import { readRateLimit } from "../../shared/middleware/rate-limit.js";

import { requireAuthentication } from "../auth/auth.middleware.js";
import { PERMISSIONS } from "../authorization/authorization.constants.js";
import { requirePermissions } from "../authorization/authorization.middleware.js";
import { auditLogsController } from "./audit-logs.controller.js";

export const auditLogsRouter = Router();

auditLogsRouter.use(requireAuthentication);

auditLogsRouter.get(
  "/",
  readRateLimit,
  requirePermissions(PERMISSIONS.AUDIT_LOGS_READ),
  auditLogsController.list,
);
