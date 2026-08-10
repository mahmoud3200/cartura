import { Router } from "express";

import { requireAuthentication } from "../auth/auth.middleware.js";
import { requirePermissions } from "../authorization/authorization.middleware.js";
import { usersController } from "./users.controller.js";
import { USER_ROUTE_PERMISSIONS } from "./users.policy.js";

export const usersRouter = Router();

usersRouter.use(requireAuthentication);

usersRouter.get(
  "/",
  requirePermissions(USER_ROUTE_PERMISSIONS.read),
  usersController.list,
);

usersRouter.get(
  "/:userId",
  requirePermissions(USER_ROUTE_PERMISSIONS.read),
  usersController.getById,
);

usersRouter.patch(
  "/:userId/status",
  requirePermissions(USER_ROUTE_PERMISSIONS.updateStatus),
  usersController.updateStatus,
);
