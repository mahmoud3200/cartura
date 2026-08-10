import type {
  CreateCategoryRequest,
  ListCategoriesQuery,
  UpdateCategoryRequest,
} from "@cartura/contracts/catalog";

import type { AuditContext } from "../../audit-logs/audit-logs.types.js";
import {
  catalogHttpError,
  conflictError,
  notFoundError,
} from "../catalog.errors.js";
import { mediaService } from "../../media/media.service.js";
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

  async create(
    input: CreateCategoryRequest,
    createdBy?: string,
    audit?: AuditContext,
  ) {
    await this.assertSlugAvailable(input.slug);

    if (input.parentCategoryId) {
      await this.assertVisibleExists(input.parentCategoryId);
    }

    const imageAssetId = input.imageAssetId;
    this.assertHasCategoryImage(imageAssetId);
    await mediaService.assertAttachableAssets(
      [imageAssetId],
      "category_banner",
    );

    return this.repository.create(
      input,
      createdBy,
      audit
        ? {
            ...audit,
            action: "category.create",
            resourceType: "category",
            metadata: {
              parentCategoryId: input.parentCategoryId ?? null,
              name: input.name,
              slug: input.slug,
              description: input.description ?? null,
              imageAssetId: input.imageAssetId,
              createdBy: createdBy ?? null,
            },
          }
        : undefined,
    );
  }

  async update(
    categoryId: string,
    input: UpdateCategoryRequest,
    audit?: AuditContext,
  ) {
    const category = await this.assertActiveExists(categoryId);

    if (input.slug !== undefined) {
      await this.assertSlugAvailable(input.slug, categoryId);
    }

    if (input.parentCategoryId !== undefined) {
      if (input.parentCategoryId === categoryId) {
        throw conflictError("A category cannot be its own parent");
      }

      if (input.parentCategoryId !== null) {
        await this.assertVisibleExists(input.parentCategoryId);
      }
    }

    let nextImageUrl = category.imageUrl;

    if (input.imageAssetId !== undefined) {
      const imageAssetId = input.imageAssetId;
      this.assertHasCategoryImage(imageAssetId);
      const imageAsset = (
        await mediaService.assertAttachableAssets(
          [imageAssetId],
          "category_banner",
          { type: "category", id: categoryId },
        )
      )[0]!;
      nextImageUrl = imageAsset.canonicalUrl;
    }

    const nextImageAssetId =
      input.imageAssetId === undefined
        ? category.imageAssetId
        : input.imageAssetId;
    this.assertHasCategoryImage(nextImageAssetId);

    return this.repository.update(
      categoryId,
      input,
      audit
        ? {
            ...audit,
            action: "category.update",
            resourceType: "category",
            resourceId: categoryId,
            metadata: {
              changedFields: Object.keys(input),
              previous: {
                parentCategoryId: category.parentCategoryId,
                name: category.name,
                slug: category.slug,
                description: category.description,
                imageUrl: category.imageUrl,
                imageAssetId: category.imageAssetId,
              },
              next: {
                parentCategoryId:
                  input.parentCategoryId === undefined
                    ? category.parentCategoryId
                    : input.parentCategoryId,
                name: input.name ?? category.name,
                slug: input.slug ?? category.slug,
                description:
                  input.description === undefined
                    ? category.description
                    : input.description,
                imageUrl: nextImageUrl,
                imageAssetId:
                  input.imageAssetId === undefined
                    ? category.imageAssetId
                    : input.imageAssetId,
              },
            },
          }
        : undefined,
    );
  }

  async softDelete(categoryId: string, audit?: AuditContext) {
    const category = await this.assertActiveExists(categoryId);

    await this.repository.softDelete(
      categoryId,
      audit
        ? {
            ...audit,
            action: "category.soft_delete",
            resourceType: "category",
            resourceId: categoryId,
            metadata: {
              previous: {
                isDeleted: category.isDeleted,
              },
              next: {
                isDeleted: true,
              },
            },
          }
        : undefined,
    );
  }

  private async assertActiveExists(categoryId: string) {
    const category = await this.repository.findActiveById(categoryId);

    if (!category) {
      throw notFoundError("Category");
    }

    return category;
  }

  private async assertVisibleExists(categoryId: string) {
    const category = await this.repository.findVisibleById(categoryId);

    if (!category) {
      throw notFoundError("Category");
    }

    return category;
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

  private assertHasCategoryImage(
    imageAssetId: string | null | undefined,
  ): asserts imageAssetId is string {
    if (!imageAssetId) {
      throw catalogHttpError(
        400,
        "CATEGORY_IMAGE_REQUIRED",
        "A category must have an image",
      );
    }
  }
}

export const categoriesService = new CategoriesService();
