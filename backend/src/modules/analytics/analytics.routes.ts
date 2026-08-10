import { Router } from "express";

import { requireAuthentication } from "../auth/auth.middleware.js";
import { requirePermissions } from "../authorization/authorization.middleware.js";
import { PERMISSIONS } from "../authorization/authorization.constants.js";
import { analyticsController } from "./analytics.controller.js";

export const managementAnalyticsRouter = Router();

managementAnalyticsRouter.use(requireAuthentication);
managementAnalyticsRouter.get(
  "/overview",
  requirePermissions(PERMISSIONS.ANALYTICS_READ),
  analyticsController.overview,
);
