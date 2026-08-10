import { Router } from "express";

import { requireAuthentication } from "../auth/auth.middleware.js";
import { notificationsController } from "./notifications.controller.js";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuthentication);

notificationsRouter.get("/", notificationsController.list);
notificationsRouter.patch("/read-all", notificationsController.markAllRead);
notificationsRouter.patch("/:notificationId/read", notificationsController.markRead);
