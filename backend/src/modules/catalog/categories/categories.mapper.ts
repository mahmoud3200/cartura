import type {
  Category,
  CategoryChild,
} from "@cartura/contracts/catalog";

import { isCategoryApiVisible } from "./categories.policy.js";
import type {
  CategoryRepositoryRecord,
  CategoryWithLineage,
} from "./categories.repository.js";

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
    children: category.children
      .filter(isCategoryApiVisible)
      .map(mapCategoryChild),
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

function mapCategoryChild(
  category: CategoryRepositoryRecord["children"][number] & {
    imageAssetId: string;
    imageUrl: string;
  },
): CategoryChild {
  return {
    id: category.id,
    parentCategoryId: category.parentCategoryId,
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
