import type {
  CreateProductRequest,
  ListProductsQuery,
  UpdateProductInventoryRequest,
  UpdateProductRequest,
} from "@cartura/contracts/catalog";
import { MAX_PRODUCT_IMAGES } from "@cartura/contracts/catalog";
import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
} from "@cartura/contracts/audit-logs";

import type { AuditContext } from "../../audit-logs/audit-logs.types.js";
import { mediaService } from "../../media/media.service.js";
import {
  catalogHttpError,
  conflictError,
  notFoundError,
  throwCatalogPersistenceError,
} from "../catalog.errors.js";
import { categoriesRepository } from "../categories/categories.repository.js";
import {
  productsRepository,
  type ProductsRepository,
} from "./products.repository.js";
import { resolveActiveProductCategoryMembership } from "./products-category-membership.js";

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
    const membership = await resolveActiveProductCategoryMembership(
      input.categoryIds,
      categoriesRepository,
    );
    this.assertHasProductImages(input.images.length);
    await mediaService.assertAttachableAssets(
      input.images.map((image) => image.mediaAssetId),
      "product_image",
    );

    try {
      return await this.repository.create(
        input,
        createdBy,
        audit
          ? {
              ...audit,
              action: AUDIT_ACTIONS.PRODUCT_CREATE,
              resourceType: AUDIT_RESOURCE_TYPES.PRODUCT,
              metadata: {
                name: input.name,
                slug: input.slug,
                sku: input.sku,
                price: input.price,
                stockQuantity: input.stockQuantity,
                categoryIds: membership.directIds,
                imageCount: input.images.length,
                mediaAssetIds: input.images.map((image) => image.mediaAssetId),
                createdBy: createdBy ?? null,
              },
            }
          : undefined,
      );
    } catch (error) {
      throwCatalogPersistenceError(error);
    }
  }

  async update(
    productId: string,
    input: UpdateProductRequest,
    audit?: AuditContext,
  ) {
    const product = await this.assertActiveExists(productId);

    if (input.slug !== undefined) {
      await this.assertSlugAvailable(input.slug, productId);
    }

    if (input.sku !== undefined) {
      await this.assertSkuAvailable(input.sku, productId);
    }

    const membership =
      input.categoryIds === undefined
        ? undefined
        : await resolveActiveProductCategoryMembership(
            input.categoryIds,
            categoriesRepository,
          );

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

    try {
      return await this.repository.update(
        productId,
        input,
        audit
          ? {
              ...audit,
              action: AUDIT_ACTIONS.PRODUCT_UPDATE,
              resourceType: AUDIT_RESOURCE_TYPES.PRODUCT,
              resourceId: productId,
              metadata: {
                changedFields: Object.keys(input),
                previous: summarizeProduct(product),
                next: {
                  name: input.name ?? product.name,
                  slug: input.slug ?? product.slug,
                  sku: input.sku ?? product.sku,
                  price: input.price ?? Number(product.price),
                  stockQuantity: product.stockQuantity,
                  isDeleted: product.isDeleted,
                  categoryIds:
                    membership?.directIds ?? directCategoryIds(product),
                  imageCount: input.images?.length ?? product.images.length,
                  mediaAssetIds:
                    input.images?.map((image) => image.mediaAssetId) ??
                    product.images.map((image) => image.mediaAssetId),
                },
              },
            }
          : undefined,
      );
    } catch (error) {
      throwCatalogPersistenceError(error);
    }
  }

  async updateInventory(
    productId: string,
    input: UpdateProductInventoryRequest,
    audit?: AuditContext,
  ) {
    const product = await this.assertActiveExists(productId);

    try {
      return await this.repository.updateInventory(
        productId,
        input.stockQuantity,
        audit
          ? {
              ...audit,
              action: AUDIT_ACTIONS.PRODUCT_INVENTORY_UPDATE,
              resourceType: AUDIT_RESOURCE_TYPES.PRODUCT,
              resourceId: productId,
              metadata: {
                previous: {
                  stockQuantity: product.stockQuantity,
                },
                next: {
                  stockQuantity: input.stockQuantity,
                },
              },
            }
          : undefined,
      );
    } catch (error) {
      throwCatalogPersistenceError(error);
    }
  }

  async softDelete(productId: string, audit?: AuditContext) {
    const product = await this.assertActiveExists(productId);

    try {
      return await this.repository.softDelete(
        productId,
        audit
          ? {
              ...audit,
              action: AUDIT_ACTIONS.PRODUCT_SOFT_DELETE,
              resourceType: AUDIT_RESOURCE_TYPES.PRODUCT,
              resourceId: productId,
              metadata: {
                previous: {
                  isDeleted: product.isDeleted,
                },
                next: {
                  isDeleted: true,
                },
              },
            }
          : undefined,
      );
    } catch (error) {
      throwCatalogPersistenceError(error);
    }
  }

  private async assertActiveExists(productId: string) {
    const product = await this.repository.findActiveById(productId);

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

    if (imageCount > MAX_PRODUCT_IMAGES) {
      throw catalogHttpError(
        400,
        "PRODUCT_IMAGE_LIMIT_EXCEEDED",
        `A product can have at most ${MAX_PRODUCT_IMAGES} images`,
      );
    }
  }
}

function summarizeProduct(
  product: Awaited<ReturnType<ProductsRepository["findActiveById"]>>,
) {
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
    categoryIds: directCategoryIds(product),
    imageCount: product.images.length,
    mediaAssetIds: product.images.map((image) => image.mediaAssetId),
  };
}

function directCategoryIds(
  product: NonNullable<
    Awaited<ReturnType<ProductsRepository["findActiveById"]>>
  >,
) {
  return product.categories
    .filter(({ isDirect }) => isDirect)
    .map(({ categoryId }) => categoryId);
}

export const productsService = new ProductsService();
