import type { RequestHandler } from "express";

import { forbiddenError, httpError } from "../../shared/errors/index.js";
import { getOptionalAuthenticatedUserId } from "../../shared/utils/request.utils.js";
import type { PermissionName } from "./authorization.constants.js";
import { authorizationService } from "./authorization.service.js";

export function requirePermissions(
  ...permissions: PermissionName[]
): RequestHandler {
  return async (req, _res, next) => {
    try {
      const userId = getOptionalAuthenticatedUserId(req);

      if (!userId) {
        next(httpError(
          500,
          "AUTHENTICATION_MIDDLEWARE_REQUIRED",
          "authenticate must run before requirePermissions",
        ));
        return;
      }

      const isAllowed = await authorizationService.hasAllPermissions(
        userId,
        permissions,
      );

      if (!isAllowed) {
        next(forbiddenError());
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireAnyPermission(
  ...permissions: PermissionName[]
): RequestHandler {
  return async (req, _res, next) => {
    try {
      const userId = getOptionalAuthenticatedUserId(req);

      if (!userId) {
        next(httpError(
          500,
          "AUTHENTICATION_MIDDLEWARE_REQUIRED",
          "authenticate must run before requireAnyPermission",
        ));
        return;
      }

      const isAllowed = await authorizationService.hasAnyPermission(
        userId,
        permissions,
      );

      if (!isAllowed) {
        next(forbiddenError());
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
