import { Router } from "express";
import {
  checkoutRateLimit,
  privilegedRateLimit,
  readRateLimit,
} from "../../shared/middleware/rate-limit.js";

import { requireAuthentication } from "../auth/auth.middleware.js";
import { requirePermissions } from "../authorization/authorization.middleware.js";
import { PERMISSIONS } from "../authorization/authorization.constants.js";
import { ordersController } from "./orders.controller.js";

export const ordersRouter = Router();
export const managementOrdersRouter = Router();

ordersRouter.use(requireAuthentication);
ordersRouter.post("/checkout", checkoutRateLimit, ordersController.checkout);
ordersRouter.post("/buy-now", checkoutRateLimit, ordersController.buyNow);
ordersRouter.get("/", readRateLimit, ordersController.listMine);
ordersRouter.get("/:orderId", readRateLimit, ordersController.getMine);

managementOrdersRouter.use(requireAuthentication);
managementOrdersRouter.get(
  "/",
  readRateLimit,
  requirePermissions(PERMISSIONS.ORDERS_READ),
  ordersController.list,
);
managementOrdersRouter.get(
  "/:orderId",
  readRateLimit,
  requirePermissions(PERMISSIONS.ORDERS_READ),
  ordersController.get,
);
managementOrdersRouter.patch(
  "/:orderId/status",
  privilegedRateLimit,
  requirePermissions(PERMISSIONS.ORDERS_UPDATE),
  ordersController.updateStatus,
);
