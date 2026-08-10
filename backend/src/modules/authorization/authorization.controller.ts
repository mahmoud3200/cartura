import type { RequestHandler } from "express";

import { PERMISSIONS } from "./authorization.constants.js";
import {
  mapPaginatedResult,
} from "../../shared/pagination/pagination.js";
import {
  getOptionalAuthenticatedUserId,
  getPathParam,
} from "../../shared/utils/request.utils.js";
import { parseInput } from "../../shared/validation/parse-input.js";
import {
  createRoleSchema,
  listRolesQuerySchema,
  updateRolePermissionsSchema,
  updateRoleSchema,
  updateUserRoleSchema,
} from "./authorization.schemas.js";
import { authorizationService } from "./authorization.service.js";
import { getAuditContext } from "../audit-logs/audit-context.js";
import {
  mapPermission,
  mapRole,
  mapUserRoleOption,
} from "./authorization.mapper.js";

export class AuthorizationController {
  listCurrentUserPermissions: RequestHandler = async (req, res, next) => {
    try {
      const userId = getOptionalAuthenticatedUserId(req) ?? "";

      res.status(200).json({
        data: await authorizationService.listUserPermissionNames(userId),
      });
    } catch (error) {
      next(error);
    }
  };

  listPermissions: RequestHandler = async (_req, res, next) => {
    try {
      res.status(200).json({
        data: (await authorizationService.listPermissions()).map(mapPermission),
      });
    } catch (error) {
      next(error);
    }
  };

  listRoles: RequestHandler = async (req, res, next) => {
    try {
      const query = parseInput(listRolesQuerySchema, req.query);
      const roles = await authorizationService.listRoles(query);

      res.status(200).json(mapPaginatedResult(roles, mapRole));
    } catch (error) {
      next(error);
    }
  };

  listAssignableUserRoles: RequestHandler = async (_req, res, next) => {
    try {
      const roles = await authorizationService.listAssignableUserRoles();

      res.status(200).json({ data: roles.map(mapUserRoleOption) });
    } catch (error) {
      next(error);
    }
  };

  getRole: RequestHandler = async (req, res, next) => {
    try {
      const role = await authorizationService.getRole(
        getPathParam(req.params.roleId),
      );

      res.status(200).json({ data: mapRole(role) });
    } catch (error) {
      next(error);
    }
  };

  createRole: RequestHandler = async (req, res, next) => {
    try {
      const body = parseInput(createRoleSchema, req.body);
      const role = await authorizationService.createCustomRole(
        body,
        getAuditContext(req),
      );
      res.status(201).json({ data: mapRole(role) });
    } catch (error) {
      next(error);
    }
  };

  updateRole: RequestHandler = async (req, res, next) => {
    try {
      const body = parseInput(updateRoleSchema, req.body);
      const role = await authorizationService.updateCustomRole({
        roleId: getPathParam(req.params.roleId),
        ...body,
        audit: getAuditContext(req),
      });
      res.status(200).json({ data: mapRole(role) });
    } catch (error) {
      next(error);
    }
  };

  updateRolePermissions: RequestHandler = async (req, res, next) => {
    try {
      const body = parseInput(updateRolePermissionsSchema, req.body);
      await authorizationService.replaceRolePermissions({
        roleId: getPathParam(req.params.roleId),
        permissionIds: body.permissionIds,
        audit: getAuditContext(req),
      });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  deleteRole: RequestHandler = async (req, res, next) => {
    try {
      await authorizationService.deleteCustomRole(
        getPathParam(req.params.roleId),
        getAuditContext(req),
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  updateUserRole: RequestHandler = async (req, res, next) => {
    try {
      const body = parseInput(updateUserRoleSchema, req.body);
      const assignedBy = getOptionalAuthenticatedUserId(req);

      await authorizationService.updateUserRole({
        userId: getPathParam(req.params.userId),
        roleId: body.roleId,
        assignedBy,
        audit: getAuditContext(req),
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

}

export const authorizationController = new AuthorizationController();
export const AUTHORIZATION_ROUTE_PERMISSIONS = PERMISSIONS;
