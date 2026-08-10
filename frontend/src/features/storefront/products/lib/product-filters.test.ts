import { describe, expect, it } from "vitest";

import {
  parseProductFilters,
  toProductListInput,
} from "./product-filters";

describe("product storefront filters", () => {
  it("normalizes URL values into a backend-safe product query", () => {
    const filters = parseProductFilters({
      q: "  hoodie  ",
      minPrice: "25",
      maxPrice: "120",
      inStock: "true",
      page: "2",
    });

    expect(toProductListInput(filters, { limit: 24 })).toEqual({
      q: "hoodie",
      minPrice: 25,
      maxPrice: 120,
      inStock: true,
      page: 2,
      limit: 24,
    });
  });

  it("drops invalid prices and retired category query parameters", () => {
    const filters = parseProductFilters({
      categorySlug: "ignored",
      minPrice: "50",
      maxPrice: "10",
      inStock: "maybe",
      page: "0",
    });

    expect(toProductListInput(filters, { limit: 12 })).toEqual({
      q: undefined,
      minPrice: 50,
      maxPrice: undefined,
      inStock: undefined,
      page: 1,
      limit: 12,
    });
  });
});
