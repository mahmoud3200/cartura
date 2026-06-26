import type { RequestHandler } from "express";
import { z } from "zod";

import type { AuthenticatedRequest } from "../../auth/index.js";
import { mapPaginated, mapProduct } from "./products.mapper.js";
import {
  createProductRequestSchema,
  listProductsQuerySchema,
  updateProductInventoryRequestSchema,
  updateProductRequestSchema,
} from "./products.schemas.js";
import { productsService } from "./products.service.js";

export class ProductsController {
  list: RequestHandler = async (req, res, next) => {
    try {
      const query = parseInput(listProductsQuerySchema, req.query);
      const products = await productsService.list(query);

      res.status(200).json(mapPaginated(products, mapProduct));
    } catch (error) {
      next(error);
    }
  };

  getBySlug: RequestHandler = async (req, res, next) => {
    try {
      const product = await productsService.getBySlug(
        getPathParam(req.params.slug),
      );

      res.status(200).json({ data: mapProduct(product) });
    } catch (error) {
      next(error);
    }
  };

  create: RequestHandler = async (req, res, next) => {
    try {
      const body = parseInput(createProductRequestSchema, req.body);
      const product = await productsService.create(
        body,
        getPrincipalUserId(req),
      );

      res.status(201).json({ data: mapProduct(product) });
    } catch (error) {
      next(error);
    }
  };

  update: RequestHandler = async (req, res, next) => {
    try {
      const body = parseInput(updateProductRequestSchema, req.body);
      const product = await productsService.update(
        getPathParam(req.params.productId),
        body,
      );

      res.status(200).json({ data: mapProduct(product) });
    } catch (error) {
      next(error);
    }
  };

  updateInventory: RequestHandler = async (req, res, next) => {
    try {
      const body = parseInput(updateProductInventoryRequestSchema, req.body);
      const product = await productsService.updateInventory(
        getPathParam(req.params.productId),
        body,
      );

      res.status(200).json({ data: mapProduct(product) });
    } catch (error) {
      next(error);
    }
  };

  deactivate: RequestHandler = async (req, res, next) => {
    try {
      const product = await productsService.deactivate(
        getPathParam(req.params.productId),
      );

      res.status(200).json({ data: mapProduct(product) });
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

function getPrincipalUserId(req: Parameters<RequestHandler>[0]): string | undefined {
  return (req as AuthenticatedRequest).principal?.userId;
}

export const productsController = new ProductsController();
