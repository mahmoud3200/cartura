import type { Product } from "@cartura/contracts/catalog";

import { isCategoryApiVisible } from "../categories/categories.policy.js";
import type { ProductWithRelations } from "./products.repository.js";

export function mapProduct(product: ProductWithRelations): Product {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    sku: product.sku,
    price: Number(product.price),
    stockQuantity: product.stockQuantity,
    isDeleted: product.isDeleted,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    categories: product.categories
      .map(({ category }) => category)
      .filter(isCategoryApiVisible)
      .map((category) => ({
        id: category.id,
        parentCategoryId: isCategoryApiVisible(category.parent)
          ? category.parentCategoryId
          : null,
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageUrl: category.imageUrl,
        isDeleted: false,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
      })),
    images: product.images.map((image) => ({
      id: image.id,
      mediaAssetId: image.mediaAssetId,
      imageUrl: image.imageUrl,
      altText: image.altText,
      displayOrder: image.displayOrder,
      createdAt: image.createdAt.toISOString(),
      updatedAt: image.updatedAt.toISOString(),
    })),
  };
}
