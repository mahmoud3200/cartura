import { describe, expect, it } from "vitest";

import type { StorefrontCategory } from "../api/categories-api";
import {
  filterCategoriesByLevel,
  parseCategoryFilters,
} from "./category-filters";

const categories = [
  { id: "main", parentCategoryId: null },
  { id: "child", parentCategoryId: "main" },
] as StorefrontCategory[];

describe("category storefront filters", () => {
  it("normalizes search and category level values", () => {
    expect(parseCategoryFilters({ q: "  hood  ", level: "main" })).toEqual({
      q: "hood",
      level: "main",
    });
    expect(parseCategoryFilters({ level: "unknown" })).toEqual({
      q: undefined,
      level: "all",
    });
  });

  it("separates main categories and subcategories", () => {
    expect(filterCategoriesByLevel(categories, "main")).toHaveLength(1);
    expect(filterCategoriesByLevel(categories, "subcategories")).toHaveLength(1);
    expect(filterCategoriesByLevel(categories, "all")).toHaveLength(2);
  });
});
