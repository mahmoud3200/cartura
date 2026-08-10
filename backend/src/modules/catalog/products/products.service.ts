import type {
  CreateProductRequest,
  ListProductsQuery,
  UpdateProductInventoryRequest,
  UpdateProductRequest,
} from "@cartura/contracts/catalog";

import type { AuditContext } from "../../audit-logs/audit-logs.types.js";
import { mediaService } from "../../media/media.service.js";
import { catalogHttpError, conflictError, notFoundError } from "../catalog.errors.js";
import { categoriesRepository } from "../categories/categories.repository.js";
import {
  productsRepository,
  type ProductsRepository,
} from "./products.repository.js";
import { expandActiveProductCategoryIds } from "./products-category-membership.js";

export class ProductsService {
  constructor(
    private readonly repository: ProductsRepository = productsRepository,
  ) {}

  list(query: ListProductsQuery) {
    return this.repository.list(query);
  }

  listByCategory(categorySlug: string, query: ListProductsQuery) {
    return this.repository.listByCategory(categorySlug, query);
  }

  async getBySlug(slug: string) {
    const product = await this.repository.findBySlug(slug);

    if (!product) {
      throw notFoundError("Product");
    }

    return product;
  }

  async create(
    input: CreateProductRequest,
    createdBy?: string,
    audit?: AuditContext,
  ) {
    await this.assertSlugAvailable(input.slug);
    await this.assertSkuAvailable(input.sku);
    const categoryIds = await expandActiveProductCategoryIds(
      input.categoryIds,
      categoriesRepository,
    );
    this.assertHasProductImages(input.images.length);
    await mediaService.assertAttachableAssets(
      input.images.map((image) => image.mediaAssetId),
      "product_image",
    );

    return this.repository.create({ ...input, categoryIds }, createdBy, audit ? {
      ...audit,
      action: "product.create",
      resourceType: "product",
      metadata: {
        name: input.name,
        slug: input.slug,
        sku: input.sku,
        price: input.price,
        stockQuantity: input.stockQuantity,
        categoryIds,
        imageCount: input.images.length,
        mediaAssetIds: input.images.map((image) => image.mediaAssetId),
        createdBy: createdBy ?? null,
      },
    } : undefined);
  }

  async update(
    productId: string,
    input: UpdateProductRequest,
    audit?: AuditContext,
  ) {
    const product = await this.assertExists(productId);

    if (input.slug !== undefined) {
      await this.assertSlugAvailable(input.slug, productId);
    }

    if (input.sku !== undefined) {
      await this.assertSkuAvailable(input.sku, productId);
    }

    if (input.categoryIds !== undefined) {
      input = {
        ...input,
        categoryIds: await expandActiveProductCategoryIds(
          input.categoryIds,
          categoriesRepository,
        ),
      };
    }

    if (input.images !== undefined) {
      this.assertHasProductImages(input.images.length);
      await mediaService.assertAttachableAssets(
        input.images.map((image) => image.mediaAssetId),
        "product_image",
        { type: "product", id: productId },
      );
    }

    if (input.images === undefined) {
      this.assertHasProductImages(product.images.length);
    }

    return this.repository.update(productId, input, audit ? {
      ...audit,
      action: "product.update",
      resourceType: "product",
      resourceId: productId,
      metadata: {
        changedFields: Object.keys(input),
        previous: summarizeProduct(product),
        next: {
          name: input.name ?? product.name,
          slug: input.slug ?? product.slug,
          sku: input.sku ?? product.sku,
          price: input.price ?? Number(product.price),
          stockQuantity: input.stockQuantity ?? product.stockQuantity,
          isDeleted: input.isDeleted ?? product.isDeleted,
          categoryIds:
            input.categoryIds ??
            product.categories.map(({ categoryId }) => categoryId),
          imageCount: input.images?.length ?? product.images.length,
          mediaAssetIds:
            input.images?.map((image) => image.mediaAssetId) ??
            product.images.map((image) => image.mediaAssetId),
        },
      },
    } : undefined);
  }

  async updateInventory(
    productId: string,
    input: UpdateProductInventoryRequest,
    audit?: AuditContext,
  ) {
    const product = await this.assertExists(productId);

    return this.repository.updateInventory(productId, input.stockQuantity, audit ? {
      ...audit,
      action: "product.inventory.update",
      resourceType: "product",
      resourceId: productId,
      metadata: {
        previous: {
          stockQuantity: product.stockQuantity,
        },
        next: {
          stockQuantity: input.stockQuantity,
        },
      },
    } : undefined);
  }

  async softDelete(productId: string, audit?: AuditContext) {
    const product = await this.assertExists(productId);

    return this.repository.softDelete(productId, audit ? {
      ...audit,
      action: "product.soft_delete",
      resourceType: "product",
      resourceId: productId,
      metadata: {
        previous: {
          isDeleted: product.isDeleted,
        },
        next: {
          isDeleted: true,
        },
      },
    } : undefined);
  }

  private async assertExists(productId: string) {
    const product = await this.repository.findById(productId);

    if (!product) {
      throw notFoundError("Product");
    }

    return product;
  }

  private async assertSlugAvailable(
    slug: string,
    currentProductId?: string,
  ): Promise<void> {
    const product = await this.repository.findBySlug(slug);

    if (product && product.id !== currentProductId) {
      throw conflictError("Product slug is already in use");
    }
  }

  private async assertSkuAvailable(
    sku: string,
    currentProductId?: string,
  ): Promise<void> {
    const product = await this.repository.findBySku(sku);

    if (product && product.id !== currentProductId) {
      throw conflictError("Product SKU is already in use");
    }
  }

  private assertHasProductImages(imageCount: number): void {
    if (imageCount < 1) {
      throw catalogHttpError(
        400,
        "PRODUCT_IMAGE_REQUIRED",
        "A product must have at least one image",
      );
    }
  }
}

function summarizeProduct(product: Awaited<ReturnType<ProductsRepository["findById"]>>) {
  if (!product) {
    return null;
  }

  return {
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    price: Number(product.price),
    stockQuantity: product.stockQuantity,
    isDeleted: product.isDeleted,
    categoryIds: product.categories.map(({ categoryId }) => categoryId),
    imageCount: product.images.length,
    mediaAssetIds: product.images.map((image) => image.mediaAssetId),
  };
}

export const productsService = new ProductsService();
