import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateTag } from "next/cache";

import {
  createManagementCategory,
  deleteManagementCategory,
  updateManagementCategory,
} from "../api/categories-api";
import { createCategoryAction } from "./create-category.action";
import { deleteCategoryAction } from "./delete-category.action";
import { updateCategoryAction } from "./update-category.action";

vi.mock("../api/categories-api", () => ({
  createManagementCategory: vi.fn(),
  deleteManagementCategory: vi.fn(),
  updateManagementCategory: vi.fn(),
}));

vi.mock("next/cache", () => ({
  updateTag: vi.fn(),
}));

const input = {
  name: "Mini Hoodies",
  slug: "mini-hoodies",
  description: "Smaller hoodies",
  parentCategoryId: "11111111-1111-4111-8111-111111111111",
  imageAssetId: "22222222-2222-4222-8222-222222222222",
};

const category = {
  id: "33333333-3333-4333-8333-333333333333",
  parentCategoryId: input.parentCategoryId,
  name: input.name,
  slug: input.slug,
  description: input.description,
  imageUrl: "https://res.cloudinary.com/example/banner.webp",
  imageAssetId: input.imageAssetId,
  isDeleted: false as const,
  createdAt: "2026-07-13T00:00:00.000Z",
  updatedAt: "2026-07-13T00:00:00.000Z",
  parentCategory: [],
};

describe("category actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates and creates through the Express API client", async () => {
    vi.mocked(createManagementCategory).mockResolvedValue(category);

    await expect(createCategoryAction(input)).resolves.toEqual({
      ok: true,
      data: category,
    });
    expect(createManagementCategory).toHaveBeenCalledWith(input);
    expect(updateTag).toHaveBeenNthCalledWith(1, "catalog:categories");
    expect(updateTag).toHaveBeenNthCalledWith(2, "catalog:products");
  });

  it("validates and updates through the Express API client", async () => {
    const update = { name: "Mini Zip Hoodies" };
    vi.mocked(updateManagementCategory).mockResolvedValue({
      ...category,
      ...update,
    });

    await expect(
      updateCategoryAction({ categoryId: category.id, category: update }),
    ).resolves.toMatchObject({ ok: true });
    expect(updateManagementCategory).toHaveBeenCalledWith({
      categoryId: category.id,
      category: update,
    });
    expect(updateTag).toHaveBeenNthCalledWith(1, "catalog:categories");
    expect(updateTag).toHaveBeenNthCalledWith(2, "catalog:products");
  });

  it("rejects image removal and deletion through the update action", async () => {
    await expect(
      updateCategoryAction({
        categoryId: category.id,
        category: { imageAssetId: null } as never,
      }),
    ).resolves.toEqual({
      ok: false,
      message: "Check the category details and try again.",
    });
    await expect(
      updateCategoryAction({
        categoryId: category.id,
        category: { isDeleted: true } as never,
      }),
    ).resolves.toEqual({
      ok: false,
      message: "Check the category details and try again.",
    });
    expect(updateManagementCategory).not.toHaveBeenCalled();
  });

  it("validates and deletes through the Express API client", async () => {
    vi.mocked(deleteManagementCategory).mockResolvedValue(undefined);

    await expect(deleteCategoryAction(category.id)).resolves.toEqual({
      ok: true,
      data: undefined,
    });
    expect(deleteManagementCategory).toHaveBeenCalledWith(category.id);
    expect(updateTag).toHaveBeenNthCalledWith(1, "catalog:categories");
    expect(updateTag).toHaveBeenNthCalledWith(2, "catalog:products");
  });

  it("rejects invalid input before calling the API client", async () => {
    await expect(deleteCategoryAction("not-a-category-id")).resolves.toEqual({
      ok: false,
      message: "Choose a valid category and try again.",
    });
    expect(deleteManagementCategory).not.toHaveBeenCalled();
    expect(updateTag).not.toHaveBeenCalled();
  });
});
