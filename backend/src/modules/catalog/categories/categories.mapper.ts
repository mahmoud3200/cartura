import type { Category } from "@cartura/contracts/catalog";

import { isCategoryApiVisible } from "./categories.policy.js";
import type { CategoryWithLineage } from "./categories.types.js";

export function mapCategory(category: CategoryWithLineage): Category {
  if (!isCategoryApiVisible(category)) {
    throw new Error("A hidden category cannot be mapped to an API response");
  }

  const parent = isCategoryApiVisible(category.parent)
    ? category.parent
    : null;

  return {
    id: category.id,
    parentCategoryId: parent?.id ?? null,
    parentCategoryName: parent?.name ?? null,
    parentCategory: category.parentCategory,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    imageAssetId: category.imageAssetId,
    isDeleted: false,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}
