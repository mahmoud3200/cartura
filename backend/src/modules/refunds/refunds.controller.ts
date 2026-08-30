import type { RequestHandler } from "express";

import { mapPaginatedResult } from "../../shared/pagination/pagination.js";
import {
  getAuthenticatedUserId,
} from "../../shared/utils/request.utils.js";
import { parseInput } from "../../shared/validation/parse-input.js";
import { getAuditContext } from "../audit-logs/audit-context.js";
import { mapCustomerRefund, mapRefund } from "./refunds.mapper.js";
import {
  confirmRefundItemReceivedRequestSchema,
  createRefundRequestSchema,
  listRefundsQuerySchema,
  refundIdParamsSchema,
  reviewRefundRequestSchema,
} from "./refunds.schemas.js";
import { refundsService } from "./refunds.service.js";

export class RefundsController {
  listMine: RequestHandler = async (req, res, next) => {
    try {
      const query = parseInput(listRefundsQuerySchema, req.query);
      const refunds = await refundsService.listForUser(
        getAuthenticatedUserId(req),
        query,
      );
      res.status(200).json(mapPaginatedResult(refunds, mapCustomerRefund));
    } catch (error) {
      next(error);
    }
  };

  requestReturn: RequestHandler = async (req, res, next) => {
    try {
      const refund = await refundsService.requestReturn(
        getAuthenticatedUserId(req),
        parseInput(createRefundRequestSchema, req.body),
        getAuditContext(req),
      );
      res.status(201).json({ data: mapCustomerRefund(refund) });
    } catch (error) {
      next(error);
    }
  };

  list: RequestHandler = async (req, res, next) => {
    try {
      const refunds = await refundsService.list(
        parseInput(listRefundsQuerySchema, req.query),
      );
      res.status(200).json(mapPaginatedResult(refunds, mapRefund));
    } catch (error) {
      next(error);
    }
  };

  review: RequestHandler = async (req, res, next) => {
    try {
      const refund = await refundsService.review(
        parseInput(refundIdParamsSchema, req.params).refundId,
        parseInput(reviewRefundRequestSchema, req.body),
        getAuthenticatedUserId(req),
        getAuditContext(req),
      );
      res.status(200).json({ data: mapRefund(refund) });
    } catch (error) {
      next(error);
    }
  };

  confirmItemReceived: RequestHandler = async (req, res, next) => {
    try {
      const refund = await refundsService.confirmItemReceived(
        parseInput(refundIdParamsSchema, req.params).refundId,
        parseInput(confirmRefundItemReceivedRequestSchema, req.body),
        getAuthenticatedUserId(req),
        getAuditContext(req),
      );
      res.status(200).json({ data: mapRefund(refund) });
    } catch (error) {
      next(error);
    }
  };

  execute: RequestHandler = async (req, res, next) => {
    try {
      const refund = await refundsService.execute(
        parseInput(refundIdParamsSchema, req.params).refundId,
        getAuditContext(req),
      );
      res.status(200).json({ data: mapRefund(refund) });
    } catch (error) {
      next(error);
    }
  };
}

export const refundsController = new RefundsController();
