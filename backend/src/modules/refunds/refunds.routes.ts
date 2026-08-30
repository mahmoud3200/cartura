import { Router } from "express";
import {
  privilegedRateLimit,
  readRateLimit,
} from "../../shared/middleware/rate-limit.js";

import { requireAuthentication } from "../auth/auth.middleware.js";
import { PERMISSIONS } from "../authorization/authorization.constants.js";
import { requirePermissions } from "../authorization/authorization.middleware.js";
import { refundsController } from "./refunds.controller.js";

export const refundsRouter = Router();
export const managementRefundsRouter = Router();

refundsRouter.use(requireAuthentication);
refundsRouter.get("/", readRateLimit, refundsController.listMine);
refundsRouter.post("/", privilegedRateLimit, refundsController.requestReturn);

managementRefundsRouter.use(requireAuthentication);
managementRefundsRouter.get(
  "/",
  readRateLimit,
  requirePermissions(PERMISSIONS.REFUNDS_READ),
  refundsController.list,
);
managementRefundsRouter.post(
  "/:refundId/review",
  privilegedRateLimit,
  requirePermissions(PERMISSIONS.REFUNDS_EXECUTE),
  refundsController.review,
);
managementRefundsRouter.post(
  "/:refundId/item-received",
  privilegedRateLimit,
  requirePermissions(PERMISSIONS.REFUNDS_EXECUTE),
  refundsController.confirmItemReceived,
);
managementRefundsRouter.post(
  "/:refundId/execute",
  privilegedRateLimit,
  requirePermissions(PERMISSIONS.REFUNDS_EXECUTE),
  refundsController.execute,
);
