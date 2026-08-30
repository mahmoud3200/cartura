import { Router } from "express";
import {
  privilegedRateLimit,
  readRateLimit,
} from "../../shared/middleware/rate-limit.js";

import { requireAuthentication } from "../auth/auth.middleware.js";
import { PERMISSIONS } from "./authorization.constants.js";
import { authorizationController } from "./authorization.controller.js";
import { requirePermissions } from "./authorization.middleware.js";

export const authorizationRouter = Router();

authorizationRouter.use(requireAuthentication);

authorizationRouter.get(
  "/me/permissions",
  readRateLimit,
  authorizationController.listCurrentUserPermissions,
);

authorizationRouter.get(
  "/permissions",
  readRateLimit,
  requirePermissions(PERMISSIONS.ROLES_READ),
  authorizationController.listPermissions,
);

authorizationRouter.get(
  "/roles",
  readRateLimit,
  requirePermissions(PERMISSIONS.ROLES_READ),
  authorizationController.listRoles,
);

authorizationRouter.get(
  "/users/role-options",
  readRateLimit,
  requirePermissions(PERMISSIONS.USERS_UPDATE_ROLE),
  authorizationController.listAssignableUserRoles,
);

authorizationRouter.get(
  "/roles/:roleId",
  readRateLimit,
  requirePermissions(PERMISSIONS.ROLES_READ),
  authorizationController.getRole,
);

authorizationRouter.post(
  "/roles",
  privilegedRateLimit,
  requirePermissions(PERMISSIONS.ROLES_CREATE),
  authorizationController.createRole,
);

authorizationRouter.patch(
  "/roles/:roleId",
  privilegedRateLimit,
  requirePermissions(PERMISSIONS.ROLES_UPDATE),
  authorizationController.updateRole,
);

authorizationRouter.put(
  "/roles/:roleId/permissions",
  privilegedRateLimit,
  requirePermissions(PERMISSIONS.ROLES_UPDATE_PERMISSIONS),
  authorizationController.updateRolePermissions,
);

authorizationRouter.delete(
  "/roles/:roleId",
  privilegedRateLimit,
  requirePermissions(PERMISSIONS.ROLES_DELETE),
  authorizationController.deleteRole,
);

authorizationRouter.put(
  "/users/:userId/role",
  privilegedRateLimit,
  requirePermissions(PERMISSIONS.USERS_UPDATE_ROLE),
  authorizationController.updateUserRole,
);
