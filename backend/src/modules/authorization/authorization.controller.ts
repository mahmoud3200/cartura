import type { RequestHandler } from "express";
import { z } from "zod";

import { PERMISSIONS } from "./authorization.constants.js";
import {
  assignUserRoleSchema,
  createRoleSchema,
  updateRolePermissionsSchema,
  updateRoleSchema,
} from "./authorization.schemas.js";
import { authorizationService } from "./authorization.service.js";
import type { AuthenticatedRequest } from "../auth/index.js";

export class AuthorizationController {
  listPermissions: RequestHandler = async (_req, res, next) => {
    try {
      res.status(200).json({
        data: await authorizationService.listPermissions(),
      });
    } catch (error) {
      next(error);
    }
  };

  listRoles: RequestHandler = async (_req, res, next) => {
    try {
      res.status(200).json({
        data: await authorizationService.listRoles(),
      });
    } catch (error) {
      next(error);
    }
  };

  createRole: RequestHandler = async (req, res, next) => {
    try {
      const body = parseBody(createRoleSchema, req.body);
      const role = await authorizationService.createCustomRole(body);
      res.status(201).json({ data: role });
    } catch (error) {
      next(error);
    }
  };

  updateRole: RequestHandler = async (req, res, next) => {
    try {
      const body = parseBody(updateRoleSchema, req.body);
      const role = await authorizationService.updateCustomRole({
        roleId: getPathParam(req.params.roleId),
        ...body,
      });
      res.status(200).json({ data: role });
    } catch (error) {
      next(error);
    }
  };

  updateRolePermissions: RequestHandler = async (req, res, next) => {
    try {
      const body = parseBody(updateRolePermissionsSchema, req.body);
      await authorizationService.replaceRolePermissions({
        roleId: getPathParam(req.params.roleId),
        permissionIds: body.permissionIds,
      });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  deleteRole: RequestHandler = async (req, res, next) => {
    try {
      await authorizationService.deleteCustomRole(getPathParam(req.params.roleId));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  assignUserRole: RequestHandler = async (req, res, next) => {
    try {
      const body = parseBody(assignUserRoleSchema, req.body);
      const assignedBy = (req as AuthenticatedRequest).principal?.userId;

      await authorizationService.assignRole({
        userId: getPathParam(req.params.userId),
        roleId: body.roleId,
        assignedBy,
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  removeUserRole: RequestHandler = async (req, res, next) => {
    try {
      await authorizationService.removeRole({
        userId: getPathParam(req.params.userId),
        roleId: getPathParam(req.params.roleId),
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

function getPathParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function parseBody<TSchema extends z.ZodType>(
  schema: TSchema,
  body: unknown,
): z.infer<TSchema> {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw Object.assign(new Error("Request validation failed"), {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      details: z.treeifyError(result.error),
    });
  }

  return result.data;
}

export const authorizationController = new AuthorizationController();
export const AUTHORIZATION_ROUTE_PERMISSIONS = PERMISSIONS;
