import { Router } from "express";
import {
  mutationRateLimit,
  readRateLimit,
} from "../../shared/middleware/rate-limit.js";

import { requireAuthentication } from "../auth/auth.middleware.js";
import { notificationsController } from "./notifications.controller.js";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuthentication);

notificationsRouter.get("/", readRateLimit, notificationsController.list);
notificationsRouter.patch(
  "/read-all",
  mutationRateLimit,
  notificationsController.markAllRead,
);
notificationsRouter.patch(
  "/:notificationId/read",
  mutationRateLimit,
  notificationsController.markRead,
);
