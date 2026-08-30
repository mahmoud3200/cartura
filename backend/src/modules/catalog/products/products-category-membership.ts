import { notFoundError } from "../catalog.errors.js";

type CategoryHierarchyReader = {
  expandWithAncestorIds(categoryIds: string[]): Promise<string[]>;
  countActiveByIds(categoryIds: string[]): PromiseLike<number>;
};

export type ProductCategoryMembership = {
  directIds: string[];
  expandedIds: string[];
};

export async function resolveActiveProductCategoryMembership(
  categoryIds: string[],
  hierarchy: CategoryHierarchyReader,
): Promise<ProductCategoryMembership> {
  if (categoryIds.length === 0) {
    return { directIds: [], expandedIds: [] };
  }

  const directIds = [...new Set(categoryIds)];
  const expandedIds = await hierarchy.expandWithAncestorIds(directIds);
  const activeCount = await hierarchy.countActiveByIds(expandedIds);

  if (activeCount !== expandedIds.length) {
    throw notFoundError("One or more categories");
  }

  return { directIds, expandedIds };
}
