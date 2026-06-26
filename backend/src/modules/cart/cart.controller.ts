import type { RequestHandler } from "express";
import { z } from "zod";

import type { AuthenticatedRequest } from "../auth/index.js";
import { mapCart } from "./cart.mapper.js";
import {
  addCartItemRequestSchema,
  updateCartItemRequestSchema,
} from "./cart.schemas.js";
import { cartService } from "./cart.service.js";

export class CartController {
  getCart: RequestHandler = async (req, res, next) => {
    try {
      const cart = await cartService.getCart(getUserId(req));
      res.status(200).json({ data: mapCart(cart) });
    } catch (error) {
      next(error);
    }
  };

  addItem: RequestHandler = async (req, res, next) => {
    try {
      const body = parseInput(addCartItemRequestSchema, req.body);
      const cart = await cartService.addItem(getUserId(req), body);
      res.status(200).json({ data: mapCart(cart) });
    } catch (error) {
      next(error);
    }
  };

  updateItem: RequestHandler = async (req, res, next) => {
    try {
      const body = parseInput(updateCartItemRequestSchema, req.body);
      const cart = await cartService.updateItem(
        getUserId(req),
        getPathParam(req.params.productId),
        body,
      );
      res.status(200).json({ data: mapCart(cart) });
    } catch (error) {
      next(error);
    }
  };

  removeItem: RequestHandler = async (req, res, next) => {
    try {
      const cart = await cartService.removeItem(
        getUserId(req),
        getPathParam(req.params.productId),
      );
      res.status(200).json({ data: mapCart(cart) });
    } catch (error) {
      next(error);
    }
  };

  clearCart: RequestHandler = async (req, res, next) => {
    try {
      const cart = await cartService.clearCart(getUserId(req));
      res.status(200).json({ data: mapCart(cart) });
    } catch (error) {
      next(error);
    }
  };
}

function parseInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
): z.infer<TSchema> {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw Object.assign(new Error("Request validation failed"), {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      details: z.treeifyError(result.error),
    });
  }

  return result.data;
}

function getPathParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function getUserId(req: Parameters<RequestHandler>[0]): string {
  const userId = (req as AuthenticatedRequest).principal?.userId;

  if (!userId) {
    throw Object.assign(new Error("Authentication is required"), {
      statusCode: 401,
      code: "UNAUTHENTICATED",
    });
  }

  return userId;
}

export const cartController = new CartController();
