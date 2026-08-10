import { Router } from "express";

import { requireAuthentication } from "../auth/auth.middleware.js";
import { requirePermissions } from "../authorization/authorization.middleware.js";
import { PERMISSIONS } from "../authorization/authorization.constants.js";
import { paymentsController } from "./payments.controller.js";

export const paymentsRouter = Router();
export const managementPaymentsRouter = Router();

paymentsRouter.post("/paymob/webhook", paymentsController.paymobWebhook);
paymentsRouter.get("/:paymentId", requireAuthentication, paymentsController.getMine);

managementPaymentsRouter.use(requireAuthentication);
managementPaymentsRouter.get(
  "/webhook-events",
  requirePermissions(PERMISSIONS.PAYMENT_WEBHOOKS_READ),
  paymentsController.listWebhookEvents,
);
managementPaymentsRouter.get(
  "/webhook-events/:eventId",
  requirePermissions(PERMISSIONS.PAYMENT_WEBHOOKS_READ),
  paymentsController.getWebhookEvent,
);
managementPaymentsRouter.post(
  "/webhook-events/:eventId/reprocess",
  requirePermissions(PERMISSIONS.PAYMENT_WEBHOOKS_REPROCESS),
  paymentsController.reprocessWebhookEvent,
);
