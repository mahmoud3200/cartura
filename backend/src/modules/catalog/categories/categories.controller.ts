import type { RequestHandler } from "express";
import { z } from "zod";

import type { AuthenticatedRequest } from "../../auth/index.js";
import { mapCategory } from "./categories.mapper.js";
import {
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

      res.status(200).json({
        data: categories.map(mapCategory),
      });
    } catch (error) {
      next(error);
    }
  };

  getBySlug: RequestHandler = async (req, res, next) => {
    try {
      const category = await categoriesService.getBySlug(
        getPathParam(req.params.slug),
      );

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
        getPrincipalUserId(req),
      );

      res.status(201).json({ data: mapCategory(category) });
    } catch (error) {
      next(error);
    }
  };

  update: RequestHandler = async (req, res, next) => {
    try {
      const body = parseInput(updateCategoryRequestSchema, req.body);
      const category = await categoriesService.update(
        getPathParam(req.params.categoryId),
        body,
      );

      res.status(200).json({ data: mapCategory(category) });
    } catch (error) {
      next(error);
    }
  };

  deactivate: RequestHandler = async (req, res, next) => {
    try {
      const category = await categoriesService.deactivate(
        getPathParam(req.params.categoryId),
      );

      res.status(200).json({ data: mapCategory(category) });
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

export const categoriesController = new CategoriesController();
