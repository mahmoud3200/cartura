import type { Product } from "@cartura/contracts/catalog";
import { useMemo, useState } from "react";

import type { CategoryOption } from "@/features/catalog-selection/types";
import {
  addDirectCategory,
  createInitialCategorySelection,
  getInheritedCategoryIds,
} from "../lib/product-category-selection";

export function useProductCategorySelection(
  initialCategories: Product["categories"] = [],
) {
  const initial = createInitialCategorySelection(initialCategories);
  const [directIds, setDirectIds] = useState(initial.directIds);
  const [lineageByCategoryId, setLineageByCategoryId] = useState(
    initial.lineageByCategoryId,
  );
  const inheritedIds = useMemo(
    () => getInheritedCategoryIds(directIds, lineageByCategoryId),
    [directIds, lineageByCategoryId],
  );

  function toggle(category: CategoryOption) {
    if (inheritedIds.has(category.id)) return;

    setLineageByCategoryId((current) => {
      const next = new Map(current);
      next.set(
        category.id,
        category.ancestors.map((ancestor) => ancestor.id),
      );
      return next;
    });
    setDirectIds((current) => {
      if (current.has(category.id)) {
        const next = new Set(current);
        next.delete(category.id);
        return next;
      }

      return addDirectCategory(current, category);
    });
  }

  function reset() {
    const next = createInitialCategorySelection(initialCategories);
    setDirectIds(next.directIds);
    setLineageByCategoryId(next.lineageByCategoryId);
  }

  return {
    directIds,
    inheritedIds,
    effectiveCount: new Set([...directIds, ...inheritedIds]).size,
    toggle,
    reset,
  };
}
