import type {
  CreateCategoryRequest,
  ListCategoriesQuery,
  UpdateCategoryRequest,
} from "@cartura/contracts/catalog";

import { conflictError, notFoundError } from "../catalog.errors.js";
import {
  categoriesRepository,
  type CategoriesRepository,
} from "./categories.repository.js";

export class CategoriesService {
  constructor(
    private readonly repository: CategoriesRepository = categoriesRepository,
  ) {}

  list(query: ListCategoriesQuery) {
    return this.repository.list(query);
  }

  async getBySlug(slug: string) {
    const category = await this.repository.findBySlug(slug);

    if (!category) {
      throw notFoundError("Category");
    }

    return category;
  }

  async create(input: CreateCategoryRequest, createdBy?: string) {
    await this.assertSlugAvailable(input.slug);

    if (input.parentCategoryId) {
      await this.assertExists(input.parentCategoryId);
    }

    return this.repository.create(input, createdBy);
  }

  async update(categoryId: string, input: UpdateCategoryRequest) {
    await this.assertExists(categoryId);

    if (input.slug !== undefined) {
      await this.assertSlugAvailable(input.slug, categoryId);
    }

    if (input.parentCategoryId !== undefined) {
      if (input.parentCategoryId === categoryId) {
        throw conflictError("A category cannot be its own parent");
      }

      if (input.parentCategoryId !== null) {
        await this.assertExists(input.parentCategoryId);
      }
    }

    return this.repository.update(categoryId, input);
  }

  async deactivate(categoryId: string) {
    await this.assertExists(categoryId);
    return this.repository.deactivate(categoryId);
  }

  private async assertExists(categoryId: string): Promise<void> {
    const category = await this.repository.findById(categoryId);

    if (!category) {
      throw notFoundError("Category");
    }
  }

  private async assertSlugAvailable(
    slug: string,
    currentCategoryId?: string,
  ): Promise<void> {
    const category = await this.repository.findBySlugAnyStatus(slug);

    if (category && category.id !== currentCategoryId) {
      throw conflictError("Category slug is already in use");
    }
  }
}

export const categoriesService = new CategoriesService();
