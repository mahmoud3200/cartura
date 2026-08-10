import type { RequestHandler } from "express";

import { mapPaginatedResult } from "../../shared/pagination/pagination.js";
import {
  getOptionalAuthenticatedUserId,
  getPathParam,
} from "../../shared/utils/request.utils.js";
import { parseInput } from "../../shared/validation/parse-input.js";
import { getAuditContext } from "../audit-logs/audit-context.js";
import { mapUser } from "./users.mapper.js";
import {
  listUsersQuerySchema,
  updateUserStatusRequestSchema,
} from "./users.schemas.js";
import { usersService } from "./users.service.js";
import type { AuthenticatedRequest } from "../../shared/types/authenticated-request.js";

export class UsersController {
  list: RequestHandler = async (req, res, next) => {
    try {
      const query = parseInput(listUsersQuerySchema, req.query);
      const users = await usersService.list(query);

      res.status(200).json(mapPaginatedResult(users, mapUser));
    } catch (error) {
      next(error);
    }
  };

  getById: RequestHandler = async (req, res, next) => {
    try {
      const user = await usersService.getById(getPathParam(req.params.userId));

      res.status(200).json({ data: mapUser(user) });
    } catch (error) {
      next(error);
    }
  };

  updateStatus: RequestHandler = async (req, res, next) => {
    try {
      const body = parseInput(updateUserStatusRequestSchema, req.body);
      const user = await usersService.updateStatus(
        getOptionalAuthenticatedUserId(req) as string,
        getPathParam(req.params.userId),
        body,
        getAuditContext(req),
      );

      res.status(200).json({ data: mapUser(user) });
    } catch (error) {
      next(error);
    }
  };
}

export const usersController = new UsersController();
