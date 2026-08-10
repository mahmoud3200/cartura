import { Router } from "express";

import { requireAuthentication } from "../auth/auth.middleware.js";
import { requirePermissions } from "../authorization/authorization.middleware.js";
import { PERMISSIONS } from "../authorization/authorization.constants.js";
import { ordersController } from "./orders.controller.js";

export const ordersRouter = Router();
export const managementOrdersRouter = Router();

ordersRouter.use(requireAuthentication);
ordersRouter.post("/checkout", ordersController.checkout);
ordersRouter.post("/buy-now", ordersController.buyNow);
ordersRouter.get("/", ordersController.listMine);
ordersRouter.get("/:orderId", ordersController.getMine);

managementOrdersRouter.use(requireAuthentication);
managementOrdersRouter.get(
  "/",
  requirePermissions(PERMISSIONS.ORDERS_READ),
  ordersController.list,
);
managementOrdersRouter.get(
  "/:orderId",
  requirePermissions(PERMISSIONS.ORDERS_READ),
  ordersController.get,
);
managementOrdersRouter.patch(
  "/:orderId/status",
  requirePermissions(PERMISSIONS.ORDERS_UPDATE),
  ordersController.updateStatus,
);
