import { Router } from "express";

import { requireAuthentication } from "../../auth/index.js";
import { requirePermissions } from "../../authorization/index.js";
import { productsController } from "./products.controller.js";
import { PRODUCT_ROUTE_PERMISSIONS } from "./products.policy.js";

export const productsRouter = Router();
export const managementProductsRouter = Router();

productsRouter.get("/", productsController.list);
productsRouter.get("/:slug", productsController.getBySlug);

managementProductsRouter.post(
  "/",
  requireAuthentication,
  requirePermissions(PRODUCT_ROUTE_PERMISSIONS.create),
  productsController.create,
);

managementProductsRouter.patch(
  "/:productId",
  requireAuthentication,
  requirePermissions(PRODUCT_ROUTE_PERMISSIONS.update),
  productsController.update,
);

managementProductsRouter.patch(
  "/:productId/inventory",
  requireAuthentication,
  requirePermissions(PRODUCT_ROUTE_PERMISSIONS.updateInventory),
  productsController.updateInventory,
);

managementProductsRouter.delete(
  "/:productId",
  requireAuthentication,
  requirePermissions(PRODUCT_ROUTE_PERMISSIONS.delete),
  productsController.deactivate,
);
