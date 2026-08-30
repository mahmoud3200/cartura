import { Router } from "express";
import {
  privilegedRateLimit,
  readRateLimit,
} from "../../shared/middleware/rate-limit.js";

import { requireAuthentication } from "../auth/auth.middleware.js";
import { requirePermissions } from "../authorization/authorization.middleware.js";
import { usersController } from "./users.controller.js";
import { USER_ROUTE_PERMISSIONS } from "./users.policy.js";

export const usersRouter = Router();

usersRouter.use(requireAuthentication);

usersRouter.get(
  "/",
  readRateLimit,
  requirePermissions(USER_ROUTE_PERMISSIONS.read),
  usersController.list,
);

usersRouter.get(
  "/:userId",
  readRateLimit,
  requirePermissions(USER_ROUTE_PERMISSIONS.read),
  usersController.getById,
);

usersRouter.patch(
  "/:userId/status",
  privilegedRateLimit,
  requirePermissions(USER_ROUTE_PERMISSIONS.updateStatus),
  usersController.updateStatus,
);
