import type {
  CreateProductRequest,
  ListProductsQuery,
  UpdateProductInventoryRequest,
  UpdateProductRequest,
} from "@cartura/contracts/catalog";

import { conflictError, notFoundError } from "../catalog.errors.js";
import { categoriesRepository } from "../categories/categories.repository.js";
import {
  productsRepository,
  type ProductsRepository,
} from "./products.repository.js";

export class ProductsService {
  constructor(
    private readonly repository: ProductsRepository = productsRepository,
  ) {}

  list(query: ListProductsQuery) {
    return this.repository.list(query);
  }

  async getBySlug(slug: string) {
    const product = await this.repository.findBySlug(slug);

    if (!product) {
      throw notFoundError("Product");
    }

    return product;
  }

  async create(input: CreateProductRequest, createdBy?: string) {
    await this.assertSlugAvailable(input.slug);
    await this.assertSkuAvailable(input.sku);
    await this.assertCategoriesExist(input.categoryIds);

    return this.repository.create(input, createdBy);
  }

  async update(productId: string, input: UpdateProductRequest) {
    await this.assertExists(productId);

    if (input.slug !== undefined) {
      await this.assertSlugAvailable(input.slug, productId);
    }

    if (input.sku !== undefined) {
      await this.assertSkuAvailable(input.sku, productId);
    }

    if (input.categoryIds !== undefined) {
      await this.assertCategoriesExist(input.categoryIds);
    }

    return this.repository.update(productId, input);
  }

  async updateInventory(
    productId: string,
    input: UpdateProductInventoryRequest,
  ) {
    await this.assertExists(productId);
    return this.repository.updateInventory(productId, input.stockQuantity);
  }

  async deactivate(productId: string) {
    await this.assertExists(productId);
    return this.repository.deactivate(productId);
  }

  private async assertExists(productId: string): Promise<void> {
    const product = await this.repository.findById(productId);

    if (!product) {
      throw notFoundError("Product");
    }
  }

  private async assertCategoriesExist(categoryIds: string[]): Promise<void> {
    if (categoryIds.length === 0) {
      return;
    }

    const uniqueIds = [...new Set(categoryIds)];
    const count = await categoriesRepository.countActiveByIds(uniqueIds);

    if (count !== uniqueIds.length) {
      throw notFoundError("One or more categories");
    }
  }

  private async assertSlugAvailable(
    slug: string,
    currentProductId?: string,
  ): Promise<void> {
    const product = await this.repository.findBySlugAnyStatus(slug);

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
}

export const productsService = new ProductsService();
