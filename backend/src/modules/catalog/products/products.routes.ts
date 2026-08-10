import { Router } from "express";

import { requireAuthentication } from "../../auth/auth.middleware.js";
import { requirePermissions } from "../../authorization/authorization.middleware.js";
import { productsController } from "./products.controller.js";
import { PRODUCT_ROUTE_PERMISSIONS } from "./products.policy.js";

export const productsRouter = Router();
export const categoryProductsRouter = Router({ mergeParams: true });
export const managementProductsRouter = Router();

productsRouter.get("/", productsController.list);
productsRouter.get("/:slug", productsController.getBySlug);
categoryProductsRouter.get("/", productsController.listByCategory);

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
  productsController.softDelete,
);
