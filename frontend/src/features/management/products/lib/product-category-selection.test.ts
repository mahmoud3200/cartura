import { describe, expect, it } from "vitest";

import {
  addDirectCategory,
  createInitialCategorySelection,
  getInheritedCategoryIds,
} from "./product-category-selection";

describe("product category selection", () => {
  it("restores stored expanded membership as one direct leaf and its ancestors", () => {
    const selection = createInitialCategorySelection([
      { id: "winter", parentCategoryId: null },
      { id: "hoodies", parentCategoryId: "winter" },
    ]);

    expect([...selection.directIds]).toEqual(["hoodies"]);
    expect(
      [...getInheritedCategoryIds(selection.directIds, selection.lineageByCategoryId)],
    ).toEqual(["winter"]);
  });

  it("supports multiple hierarchy levels", () => {
    const selection = createInitialCategorySelection([
      { id: "winter", parentCategoryId: null },
      { id: "hoodies", parentCategoryId: "winter" },
      { id: "zip-hoodies", parentCategoryId: "hoodies" },
    ]);

    expect([...selection.directIds]).toEqual(["zip-hoodies"]);
    expect(
      [...getInheritedCategoryIds(selection.directIds, selection.lineageByCategoryId)],
    ).toEqual(["winter", "hoodies"]);
  });

  it("replaces a redundant direct parent when its child is selected", () => {
    const directIds = addDirectCategory(new Set(["winter"]), {
      id: "hoodies",
      parentCategoryId: "winter",
      name: "Hoodies",
      slug: "hoodies",
      description: "/hoodies",
      imageUrl: null,
      ancestors: [{ id: "winter", name: "Winter", slug: "winter" }],
    });

    expect([...directIds]).toEqual(["hoodies"]);
  });
});
