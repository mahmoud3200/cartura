import type { RequestHandler } from "express";

import {
  mapPaginatedResult,
} from "../../shared/pagination/pagination.js";
import {
  getAuthenticatedUserId,
  getOptionalAuthenticatedUserId,
} from "../../shared/utils/request.utils.js";
import { parseInput } from "../../shared/validation/parse-input.js";
import {
  createRoleSchema,
  listRolesQuerySchema,
  roleIdParamsSchema,
  updateRolePermissionsSchema,
  updateRoleSchema,
  updateUserRoleSchema,
  authorizationUserIdParamsSchema,
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
      const { roleId } = parseInput(roleIdParamsSchema, req.params);
      const role = await authorizationService.getRole(
        roleId,
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
      const { roleId } = parseInput(roleIdParamsSchema, req.params);
      const body = parseInput(updateRoleSchema, req.body);
      const role = await authorizationService.updateCustomRole({
        roleId,
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
      const { roleId } = parseInput(roleIdParamsSchema, req.params);
      const body = parseInput(updateRolePermissionsSchema, req.body);
      await authorizationService.replaceRolePermissions({
        roleId,
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
      const { roleId } = parseInput(roleIdParamsSchema, req.params);
      await authorizationService.deleteCustomRole(
        roleId,
        getAuditContext(req),
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  updateUserRole: RequestHandler = async (req, res, next) => {
    try {
      const { userId } = parseInput(
        authorizationUserIdParamsSchema,
        req.params,
      );
      const body = parseInput(updateUserRoleSchema, req.body);

      await authorizationService.updateUserRole({
        userId,
        roleId: body.roleId,
        actingUserId: getAuthenticatedUserId(req),
        audit: getAuditContext(req),
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

}

export const authorizationController = new AuthorizationController();
