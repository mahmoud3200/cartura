import { Router } from "express";

import { requireAuthentication } from "../auth/index.js";
import { PERMISSIONS } from "./authorization.constants.js";
import { authorizationController } from "./authorization.controller.js";
import { requirePermissions } from "./authorization.middleware.js";

export const authorizationRouter = Router();

authorizationRouter.use(requireAuthentication);

authorizationRouter.get(
  "/permissions",
  requirePermissions(PERMISSIONS.ROLES_READ),
  authorizationController.listPermissions,
);

authorizationRouter.get(
  "/roles",
  requirePermissions(PERMISSIONS.ROLES_READ),
  authorizationController.listRoles,
);

authorizationRouter.post(
  "/roles",
  requirePermissions(PERMISSIONS.ROLES_CREATE),
  authorizationController.createRole,
);

authorizationRouter.patch(
  "/roles/:roleId",
  requirePermissions(PERMISSIONS.ROLES_UPDATE),
  authorizationController.updateRole,
);

authorizationRouter.put(
  "/roles/:roleId/permissions",
  requirePermissions(PERMISSIONS.ROLES_UPDATE_PERMISSIONS),
  authorizationController.updateRolePermissions,
);

authorizationRouter.delete(
  "/roles/:roleId",
  requirePermissions(PERMISSIONS.ROLES_DELETE),
  authorizationController.deleteRole,
);

authorizationRouter.put(
  "/users/:userId/roles",
  requirePermissions(PERMISSIONS.USERS_ASSIGN_ROLES),
  authorizationController.assignUserRole,
);

authorizationRouter.delete(
  "/users/:userId/roles/:roleId",
  requirePermissions(PERMISSIONS.USERS_ASSIGN_ROLES),
  authorizationController.removeUserRole,
);
