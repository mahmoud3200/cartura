import type { RequestHandler } from "express";

import { getAuthenticatedUserId } from "../../shared/utils/request.utils.js";
import { mapPaginatedResult } from "../../shared/pagination/pagination.js";
import { parseInput } from "../../shared/validation/parse-input.js";
import { mapNotification } from "./notifications.mapper.js";
import {
  listNotificationsQuerySchema,
  notificationIdParamsSchema,
} from "./notifications.schemas.js";
import { notificationsService } from "./notifications.service.js";

export class NotificationsController {
  list: RequestHandler = async (req, res, next) => {
    try {
      const query = parseInput(listNotificationsQuerySchema, req.query);
      const result = await notificationsService.list(
        getAuthenticatedUserId(req),
        query,
      );

      res.status(200).json({
        ...mapPaginatedResult(result, mapNotification),
        unreadCount: result.unreadCount,
      });
    } catch (error) {
      next(error);
    }
  };

  markRead: RequestHandler = async (req, res, next) => {
    try {
      const { notificationId } = parseInput(
        notificationIdParamsSchema,
        req.params,
      );
      const notification = await notificationsService.markRead(
        getAuthenticatedUserId(req),
        notificationId,
      );

      res.status(200).json({ data: mapNotification(notification) });
    } catch (error) {
      next(error);
    }
  };

  markAllRead: RequestHandler = async (req, res, next) => {
    try {
      const result = await notificationsService.markAllRead(
        getAuthenticatedUserId(req),
      );

      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  };
}

export const notificationsController = new NotificationsController();
