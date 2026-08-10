import type { RequestHandler } from "express";

import { parseInput } from "../../shared/validation/parse-input.js";
import { getAuditContext } from "../audit-logs/audit-context.js";
import { mapPaginatedResult } from "../../shared/pagination/pagination.js";
import {
  getAuthenticatedUserId,
  getOptionalAuthenticatedUserId,
  getPathParam,
} from "../../shared/utils/request.utils.js";
import { mapOrder } from "./orders.mapper.js";
import {
  buyNowCheckoutRequestSchema,
  checkoutOrderRequestSchema,
  listOrdersQuerySchema,
  updateOrderStatusRequestSchema,
} from "./orders.schemas.js";
import { ordersService } from "./orders.service.js";

export class OrdersController {
  checkout: RequestHandler = async (req, res, next) => {
    try {
      const body = parseInput(checkoutOrderRequestSchema, req.body);
      const result = await ordersService.checkout(
        getAuthenticatedUserId(req),
        body,
      );

      res.status(201).json({
        data: {
          order: mapOrder(result.order),
          checkoutUrl: result.checkoutUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  buyNow: RequestHandler = async (req, res, next) => {
    try {
      const body = parseInput(buyNowCheckoutRequestSchema, req.body);
      const result = await ordersService.buyNow(
        getAuthenticatedUserId(req),
        body,
      );

      res.status(201).json({
        data: {
          order: mapOrder(result.order),
          checkoutUrl: result.checkoutUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  listMine: RequestHandler = async (req, res, next) => {
    try {
      const query = parseInput(listOrdersQuerySchema, req.query);
      const orders = await ordersService.listForUser(
        getAuthenticatedUserId(req),
        query,
      );

      res.status(200).json(mapPaginatedResult(orders, mapOrder));
    } catch (error) {
      next(error);
    }
  };

  getMine: RequestHandler = async (req, res, next) => {
    try {
      const order = await ordersService.getForUser(
        getAuthenticatedUserId(req),
        getPathParam(req.params.orderId),
      );

      res.status(200).json({ data: mapOrder(order) });
    } catch (error) {
      next(error);
    }
  };

  list: RequestHandler = async (req, res, next) => {
    try {
      const query = parseInput(listOrdersQuerySchema, req.query);
      const orders = await ordersService.list(query);

      res.status(200).json(mapPaginatedResult(orders, mapOrder));
    } catch (error) {
      next(error);
    }
  };

  get: RequestHandler = async (req, res, next) => {
    try {
      const order = await ordersService.get(getPathParam(req.params.orderId));

      res.status(200).json({ data: mapOrder(order) });
    } catch (error) {
      next(error);
    }
  };

  updateStatus: RequestHandler = async (req, res, next) => {
    try {
      const body = parseInput(updateOrderStatusRequestSchema, req.body);
      const order = await ordersService.updateStatus(
        getPathParam(req.params.orderId),
        body,
        getOptionalAuthenticatedUserId(req),
        getAuditContext(req),
      );

      res.status(200).json({ data: mapOrder(order) });
    } catch (error) {
      next(error);
    }
  };
}

export const ordersController = new OrdersController();
