import type { StorefrontCategory } from "../api/categories-api";

export type CategoryLevel = "all" | "main" | "subcategories";

export type CategoryFilterValues = {
  q?: string;
  level: CategoryLevel;
};

type SearchParams = Record<string, string | string[] | undefined>;

export function parseCategoryFilters(
  searchParams: SearchParams,
): CategoryFilterValues {
  const qValue = first(searchParams.q)?.trim();
  const levelValue = first(searchParams.level);

  return {
    q: qValue ? qValue.slice(0, 120) : undefined,
    level:
      levelValue === "main" || levelValue === "subcategories"
        ? levelValue
        : "all",
  };
}

export function filterCategoriesByLevel(
  categories: StorefrontCategory[],
  level: CategoryLevel,
) {
  if (level === "main") {
    return categories.filter((category) => !category.parentCategoryId);
  }

  if (level === "subcategories") {
    return categories.filter((category) => Boolean(category.parentCategoryId));
  }

  return categories;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
