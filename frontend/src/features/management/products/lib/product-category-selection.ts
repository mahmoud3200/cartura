import type { CategoryOption } from "@/features/catalog-selection/types";

export type CategoryMembershipSeed = {
  id: string;
  parentCategoryId?: string | null;
};

export function createInitialCategorySelection(
  categories: CategoryMembershipSeed[],
) {
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const parentIds = new Set(
    categories
      .map((category) => category.parentCategoryId)
      .filter((categoryId): categoryId is string => Boolean(categoryId)),
  );
  const directIds = new Set(
    categories
      .map((category) => category.id)
      .filter((categoryId) => !parentIds.has(categoryId)),
  );
  const lineageByCategoryId = new Map<string, string[]>();

  for (const categoryId of directIds) {
    lineageByCategoryId.set(
      categoryId,
      resolveStoredAncestorIds(categoryId, categoryById),
    );
  }

  return { directIds, lineageByCategoryId };
}

export function getInheritedCategoryIds(
  directIds: Set<string>,
  lineageByCategoryId: Map<string, string[]>,
) {
  const inheritedIds = new Set<string>();

  for (const categoryId of directIds) {
    for (const ancestorId of lineageByCategoryId.get(categoryId) ?? []) {
      if (!directIds.has(ancestorId)) inheritedIds.add(ancestorId);
    }
  }

  return inheritedIds;
}

export function addDirectCategory(
  current: Set<string>,
  category: CategoryOption,
) {
  const next = new Set(current);
  category.ancestors.forEach((ancestor) => next.delete(ancestor.id));
  next.add(category.id);
  return next;
}

function resolveStoredAncestorIds(
  categoryId: string,
  categoryById: Map<string, CategoryMembershipSeed>,
) {
  const ancestorIds: string[] = [];
  const visited = new Set([categoryId]);
  let parentId = categoryById.get(categoryId)?.parentCategoryId ?? null;

  while (parentId && !visited.has(parentId)) {
    ancestorIds.unshift(parentId);
    visited.add(parentId);
    parentId = categoryById.get(parentId)?.parentCategoryId ?? null;
  }

  return ancestorIds;
}
