import type { RequestHandler } from "express";

import { getAuthenticatedUserId } from "../../shared/utils/request.utils.js";
import { parseInput } from "../../shared/validation/parse-input.js";
import { mapCart } from "./cart.mapper.js";
import {
  addCartItemRequestSchema,
  cartItemParamsSchema,
  updateCartItemRequestSchema,
} from "./cart.schemas.js";
import { cartService } from "./cart.service.js";

export class CartController {
  getCart: RequestHandler = async (req, res, next) => {
    try {
      const cart = await cartService.getCart(getAuthenticatedUserId(req));
      res.status(200).json({ data: mapCart(cart) });
    } catch (error) {
      next(error);
    }
  };

  addItem: RequestHandler = async (req, res, next) => {
    try {
      const body = parseInput(addCartItemRequestSchema, req.body);
      const cart = await cartService.addItem(
        getAuthenticatedUserId(req),
        body,
      );
      res.status(200).json({ data: mapCart(cart) });
    } catch (error) {
      next(error);
    }
  };

  updateItem: RequestHandler = async (req, res, next) => {
    try {
      const { productId } = parseInput(cartItemParamsSchema, req.params);
      const body = parseInput(updateCartItemRequestSchema, req.body);
      const cart = await cartService.updateItem(
        getAuthenticatedUserId(req),
        productId,
        body,
      );
      res.status(200).json({ data: mapCart(cart) });
    } catch (error) {
      next(error);
    }
  };

  removeItem: RequestHandler = async (req, res, next) => {
    try {
      const { productId } = parseInput(cartItemParamsSchema, req.params);
      const cart = await cartService.removeItem(
        getAuthenticatedUserId(req),
        productId,
      );
      res.status(200).json({ data: mapCart(cart) });
    } catch (error) {
      next(error);
    }
  };

  clearCart: RequestHandler = async (req, res, next) => {
    try {
      const cart = await cartService.clearCart(getAuthenticatedUserId(req));
      res.status(200).json({ data: mapCart(cart) });
    } catch (error) {
      next(error);
    }
  };
}

export const cartController = new CartController();
