import { Router } from "express";

import { requireAuthentication } from "../../auth/index.js";
import { requirePermissions } from "../../authorization/index.js";
import { categoriesController } from "./categories.controller.js";
import { CATEGORY_ROUTE_PERMISSIONS } from "./categories.policy.js";

export const categoriesRouter = Router();
export const managementCategoriesRouter = Router();

categoriesRouter.get("/", categoriesController.list);
categoriesRouter.get("/:slug", categoriesController.getBySlug);

managementCategoriesRouter.post(
  "/",
  requireAuthentication,
  requirePermissions(CATEGORY_ROUTE_PERMISSIONS.create),
  categoriesController.create,
);

managementCategoriesRouter.patch(
  "/:categoryId",
  requireAuthentication,
  requirePermissions(CATEGORY_ROUTE_PERMISSIONS.update),
  categoriesController.update,
);

managementCategoriesRouter.delete(
  "/:categoryId",
  requireAuthentication,
  requirePermissions(CATEGORY_ROUTE_PERMISSIONS.delete),
  categoriesController.deactivate,
);
