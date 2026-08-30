import type { RequestHandler } from "express";

import { parseInput } from "../../../shared/validation/parse-input.js";
import {
  getAuthenticatedUserId,
} from "../../../shared/utils/request.utils.js";
import { getAuditContext } from "../../audit-logs/audit-context.js";
import { mapPaginatedResult } from "../../../shared/pagination/pagination.js";
import { mapProduct } from "./products.mapper.js";
import {
  categoryProductsParamsSchema,
  createProductRequestSchema,
  listProductsQuerySchema,
  productIdParamsSchema,
  productSlugParamsSchema,
  updateProductInventoryRequestSchema,
  updateProductRequestSchema,
} from "./products.schemas.js";
import { productsService } from "./products.service.js";

export class ProductsController {
  list: RequestHandler = async (req, res, next) => {
    try {
      const query = parseInput(listProductsQuerySchema, req.query);
      const products = await productsService.list(query);

      res.status(200).json(mapPaginatedResult(products, mapProduct));
    } catch (error) {
      next(error);
    }
  };

  listByCategory: RequestHandler = async (req, res, next) => {
    try {
      const query = parseInput(listProductsQuerySchema, req.query);
      const { categorySlug } = parseInput(
        categoryProductsParamsSchema,
        req.params,
      );
      const products = await productsService.listByCategory(
        categorySlug,
        query,
      );

      res.status(200).json(mapPaginatedResult(products, mapProduct));
    } catch (error) {
      next(error);
    }
  };

  getBySlug: RequestHandler = async (req, res, next) => {
    try {
      const { slug } = parseInput(productSlugParamsSchema, req.params);
      const product = await productsService.getBySlug(slug);

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
        getAuthenticatedUserId(req),
        getAuditContext(req),
      );

      res.status(201).json({ data: mapProduct(product) });
    } catch (error) {
      next(error);
    }
  };

  update: RequestHandler = async (req, res, next) => {
    try {
      const body = parseInput(updateProductRequestSchema, req.body);
      const { productId } = parseInput(productIdParamsSchema, req.params);
      const product = await productsService.update(
        productId,
        body,
        getAuditContext(req),
      );

      res.status(200).json({ data: mapProduct(product) });
    } catch (error) {
      next(error);
    }
  };

  updateInventory: RequestHandler = async (req, res, next) => {
    try {
      const body = parseInput(updateProductInventoryRequestSchema, req.body);
      const { productId } = parseInput(productIdParamsSchema, req.params);
      const product = await productsService.updateInventory(
        productId,
        body,
        getAuditContext(req),
      );

      res.status(200).json({ data: mapProduct(product) });
    } catch (error) {
      next(error);
    }
  };

  softDelete: RequestHandler = async (req, res, next) => {
    try {
      const { productId } = parseInput(productIdParamsSchema, req.params);
      const product = await productsService.softDelete(
        productId,
        getAuditContext(req),
      );

      res.status(200).json({ data: mapProduct(product) });
    } catch (error) {
      next(error);
    }
  };
}

export const productsController = new ProductsController();
