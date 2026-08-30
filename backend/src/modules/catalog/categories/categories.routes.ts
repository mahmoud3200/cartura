import { Router } from "express";
import {
  mutationRateLimit,
  privilegedRateLimit,
  readRateLimit,
} from "../../../shared/middleware/rate-limit.js";

import { requireAuthentication } from "../../auth/auth.middleware.js";
import { requirePermissions } from "../../authorization/authorization.middleware.js";
import { categoriesController } from "./categories.controller.js";
import { CATEGORY_ROUTE_PERMISSIONS } from "./categories.policy.js";

export const categoriesRouter = Router();
export const managementCategoriesRouter = Router();

categoriesRouter.get("/", readRateLimit, categoriesController.list);
categoriesRouter.get("/:slug", readRateLimit, categoriesController.getBySlug);

managementCategoriesRouter.post(
  "/",
  requireAuthentication,
  mutationRateLimit,
  requirePermissions(CATEGORY_ROUTE_PERMISSIONS.create),
  categoriesController.create,
);

managementCategoriesRouter.patch(
  "/:categoryId",
  requireAuthentication,
  mutationRateLimit,
  requirePermissions(CATEGORY_ROUTE_PERMISSIONS.update),
  categoriesController.update,
);

managementCategoriesRouter.delete(
  "/:categoryId",
  requireAuthentication,
  privilegedRateLimit,
  requirePermissions(CATEGORY_ROUTE_PERMISSIONS.delete),
  categoriesController.softDelete,
);
