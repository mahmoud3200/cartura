import { Router } from "express";
import {
  mutationRateLimit,
  privilegedRateLimit,
  readRateLimit,
} from "../../../shared/middleware/rate-limit.js";

import { requireAuthentication } from "../../auth/auth.middleware.js";
import { requirePermissions } from "../../authorization/authorization.middleware.js";
import { productsController } from "./products.controller.js";
import { PRODUCT_ROUTE_PERMISSIONS } from "./products.policy.js";

export const productsRouter = Router();
export const categoryProductsRouter = Router({ mergeParams: true });
export const managementProductsRouter = Router();

productsRouter.get("/", readRateLimit, productsController.list);
productsRouter.get("/:slug", readRateLimit, productsController.getBySlug);
categoryProductsRouter.get("/", readRateLimit, productsController.listByCategory);

managementProductsRouter.post(
  "/",
  requireAuthentication,
  mutationRateLimit,
  requirePermissions(PRODUCT_ROUTE_PERMISSIONS.create),
  productsController.create,
);

managementProductsRouter.patch(
  "/:productId",
  requireAuthentication,
  mutationRateLimit,
  requirePermissions(PRODUCT_ROUTE_PERMISSIONS.update),
  productsController.update,
);

managementProductsRouter.patch(
  "/:productId/inventory",
  requireAuthentication,
  mutationRateLimit,
  requirePermissions(PRODUCT_ROUTE_PERMISSIONS.updateInventory),
  productsController.updateInventory,
);

managementProductsRouter.delete(
  "/:productId",
  requireAuthentication,
  privilegedRateLimit,
  requirePermissions(PRODUCT_ROUTE_PERMISSIONS.delete),
  productsController.softDelete,
);
