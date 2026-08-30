import type { RequestHandler } from "express";

import { parseInput } from "../../../shared/validation/parse-input.js";
import {
  getAuthenticatedUserId,
} from "../../../shared/utils/request.utils.js";
import { getAuditContext } from "../../audit-logs/audit-context.js";
import { mapPaginatedResult } from "../../../shared/pagination/pagination.js";
import { mapCategory } from "./categories.mapper.js";
import {
  categoryIdParamsSchema,
  categorySlugParamsSchema,
  createCategoryRequestSchema,
  listCategoriesQuerySchema,
  updateCategoryRequestSchema,
} from "./categories.schemas.js";
import { categoriesService } from "./categories.service.js";

export class CategoriesController {
  list: RequestHandler = async (req, res, next) => {
    try {
      const query = parseInput(listCategoriesQuerySchema, req.query);
      const categories = await categoriesService.list(query);

      res.status(200).json(mapPaginatedResult(categories, mapCategory));
    } catch (error) {
      next(error);
    }
  };

  getBySlug: RequestHandler = async (req, res, next) => {
    try {
      const { slug } = parseInput(categorySlugParamsSchema, req.params);
      const category = await categoriesService.getBySlug(slug);

      res.status(200).json({ data: mapCategory(category) });
    } catch (error) {
      next(error);
    }
  };

  create: RequestHandler = async (req, res, next) => {
    try {
      const body = parseInput(createCategoryRequestSchema, req.body);
      const category = await categoriesService.create(
        body,
        getAuthenticatedUserId(req),
        getAuditContext(req),
      );

      res.status(201).json({ data: mapCategory(category) });
    } catch (error) {
      next(error);
    }
  };

  update: RequestHandler = async (req, res, next) => {
    try {
      const body = parseInput(updateCategoryRequestSchema, req.body);
      const { categoryId } = parseInput(categoryIdParamsSchema, req.params);
      const category = await categoriesService.update(
        categoryId,
        body,
        getAuditContext(req),
      );

      res.status(200).json({ data: mapCategory(category) });
    } catch (error) {
      next(error);
    }
  };

  softDelete: RequestHandler = async (req, res, next) => {
    try {
      const { categoryId } = parseInput(categoryIdParamsSchema, req.params);
      await categoriesService.softDelete(
        categoryId,
        getAuditContext(req),
      );

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

export const categoriesController = new CategoriesController();
