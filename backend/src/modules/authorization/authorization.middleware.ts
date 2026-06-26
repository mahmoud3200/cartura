import type { RequestHandler } from "express";

import type { AuthenticatedRequest } from "../auth/index.js";
import type { PermissionName } from "./authorization.constants.js";
import { authorizationService } from "./authorization.service.js";

export function requirePermissions(
  ...permissions: PermissionName[]
): RequestHandler {
  return async (req, res, next) => {
    try {
      const userId = (req as AuthenticatedRequest).principal?.userId;

      // only if SOMEHOW the authentication middleware didn't work
      if (!userId) {
        res.status(500).json({
          error: {
            code: "AUTHENTICATION_MIDDLEWARE_REQUIRED",
            message: "authenticate must run before requirePermissions",
          },
        });
        return;
      }

      const isAllowed = await authorizationService.hasAllPermissions(
        userId,
        permissions,
      );

      if (!isAllowed) {
        res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to perform this action",
          },
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
