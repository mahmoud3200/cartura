import { notFoundError } from "../catalog.errors.js";

type CategoryHierarchyReader = {
  expandWithAncestorIds(categoryIds: string[]): Promise<string[]>;
  countActiveByIds(categoryIds: string[]): PromiseLike<number>;
};

export async function expandActiveProductCategoryIds(
  categoryIds: string[],
  hierarchy: CategoryHierarchyReader,
) {
  if (categoryIds.length === 0) return [];

  const uniqueIds = [...new Set(categoryIds)];
  const expandedIds = await hierarchy.expandWithAncestorIds(uniqueIds);
  const activeCount = await hierarchy.countActiveByIds(expandedIds);

  if (activeCount !== expandedIds.length) {
    throw notFoundError("One or more categories");
  }

  return expandedIds;
}
