import { Router } from "express";

import { requireAuthentication } from "../auth/auth.middleware.js";
import { PERMISSIONS } from "../authorization/authorization.constants.js";
import { requirePermissions } from "../authorization/authorization.middleware.js";
import { refundsController } from "./refunds.controller.js";

export const refundsRouter = Router();
export const managementRefundsRouter = Router();

refundsRouter.use(requireAuthentication);
refundsRouter.get("/", refundsController.listMine);
refundsRouter.post("/", refundsController.requestReturn);

managementRefundsRouter.use(requireAuthentication);
managementRefundsRouter.get(
  "/",
  requirePermissions(PERMISSIONS.REFUNDS_READ),
  refundsController.list,
);
managementRefundsRouter.post(
  "/:refundId/review",
  requirePermissions(PERMISSIONS.REFUNDS_EXECUTE),
  refundsController.review,
);
managementRefundsRouter.post(
  "/:refundId/item-received",
  requirePermissions(PERMISSIONS.REFUNDS_EXECUTE),
  refundsController.confirmItemReceived,
);
managementRefundsRouter.post(
  "/:refundId/execute",
  requirePermissions(PERMISSIONS.REFUNDS_EXECUTE),
  refundsController.execute,
);
