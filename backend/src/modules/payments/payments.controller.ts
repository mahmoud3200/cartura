import type { RequestHandler } from "express";

import { mapPaginatedResult } from "../../shared/pagination/pagination.js";
import {
  getAuthenticatedUserId,
  getPathParam,
} from "../../shared/utils/request.utils.js";
import { parseInput } from "../../shared/validation/parse-input.js";
import { getAuditContext } from "../audit-logs/audit-context.js";
import { mapPayment, mapPaymentWebhookEvent } from "./payments.mapper.js";
import {
  listPaymentWebhookEventsQuerySchema,
  paymobWebhookQuerySchema,
} from "./payments.schemas.js";
import { paymentsService } from "./payments.service.js";

export class PaymentsController {
  getMine: RequestHandler = async (req, res, next) => {
    try {
      const payment = await paymentsService.getForUser(
        getAuthenticatedUserId(req),
        getPathParam(req.params.paymentId),
      );

      res.status(200).json({ data: mapPayment(payment) });
    } catch (error) {
      next(error);
    }
  };

  paymobWebhook: RequestHandler = async (req, res, next) => {
    try {
      const query = parseInput(paymobWebhookQuerySchema, req.query);
      const result = await paymentsService.handlePaymobWebhook(
        req.body,
        query.hmac,
      );

      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  listWebhookEvents: RequestHandler = async (req, res, next) => {
    try {
      const query = parseInput(listPaymentWebhookEventsQuerySchema, req.query);
      const events = await paymentsService.listWebhookEvents(query);

      res.status(200).json(mapPaginatedResult(events, mapPaymentWebhookEvent));
    } catch (error) {
      next(error);
    }
  };

  getWebhookEvent: RequestHandler = async (req, res, next) => {
    try {
      const event = await paymentsService.getWebhookEvent(
        getPathParam(req.params.eventId),
      );

      res.status(200).json({ data: mapPaymentWebhookEvent(event) });
    } catch (error) {
      next(error);
    }
  };

  reprocessWebhookEvent: RequestHandler = async (req, res, next) => {
    try {
      const result = await paymentsService.reprocessWebhookEvent(
        getPathParam(req.params.eventId),
        getAuditContext(req),
      );

      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  };
}

export const paymentsController = new PaymentsController();
