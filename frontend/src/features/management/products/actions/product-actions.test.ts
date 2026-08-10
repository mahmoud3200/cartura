import { updateTag } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createManagementProduct,
  deleteManagementProduct,
  updateManagementProduct,
} from "../api/products-api";
import { createProductAction } from "./create-product.action";
import { deleteProductAction } from "./delete-product.action";
import { updateProductAction } from "./update-product.action";

vi.mock("../api/products-api", () => ({
  createManagementProduct: vi.fn(),
  deleteManagementProduct: vi.fn(),
  updateManagementProduct: vi.fn(),
}));

vi.mock("next/cache", () => ({
  updateTag: vi.fn(),
}));

const input = {
  name: "Mini Hoodie",
  slug: "mini-hoodie",
  description: "A smaller hoodie",
  sku: "MINI-HOODIE-1",
  price: 799,
  stockQuantity: 10,
  categoryIds: ["11111111-1111-4111-8111-111111111111"],
  images: [
    {
      mediaAssetId: "22222222-2222-4222-8222-222222222222",
      altText: "Mini hoodie",
      displayOrder: 0,
    },
  ],
};

const product = {
  id: "33333333-3333-4333-8333-333333333333",
  name: input.name,
  slug: input.slug,
  description: input.description,
  sku: input.sku,
  price: input.price,
  stockQuantity: input.stockQuantity,
  isDeleted: false,
  createdAt: "2026-07-13T00:00:00.000Z",
  updatedAt: "2026-07-13T00:00:00.000Z",
  categories: [],
  images: [],
};

describe("product actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates the product cache tag after creation", async () => {
    vi.mocked(createManagementProduct).mockResolvedValue(product);

    await expect(createProductAction(input)).resolves.toEqual({
      ok: true,
      data: product,
    });
    expect(createManagementProduct).toHaveBeenCalledWith(input);
    expect(updateTag).toHaveBeenCalledOnce();
    expect(updateTag).toHaveBeenCalledWith("catalog:products");
  });

  it("updates the product cache tag after editing", async () => {
    const update = { name: "Mini Zip Hoodie" };
    vi.mocked(updateManagementProduct).mockResolvedValue({
      ...product,
      ...update,
    });

    await expect(
      updateProductAction({ productId: product.id, product: update }),
    ).resolves.toMatchObject({ ok: true });
    expect(updateManagementProduct).toHaveBeenCalledWith({
      productId: product.id,
      product: update,
    });
    expect(updateTag).toHaveBeenCalledOnce();
    expect(updateTag).toHaveBeenCalledWith("catalog:products");
  });

  it("updates the product cache tag after deletion", async () => {
    vi.mocked(deleteManagementProduct).mockResolvedValue(product);

    await expect(deleteProductAction(product.id)).resolves.toEqual({
      ok: true,
      data: product,
    });
    expect(deleteManagementProduct).toHaveBeenCalledWith(product.id);
    expect(updateTag).toHaveBeenCalledOnce();
    expect(updateTag).toHaveBeenCalledWith("catalog:products");
  });

  it("does not update the cache tag for invalid input", async () => {
    await expect(deleteProductAction("not-a-product-id")).resolves.toEqual({
      ok: false,
      message: "Choose a valid product and try again.",
    });
    expect(deleteManagementProduct).not.toHaveBeenCalled();
    expect(updateTag).not.toHaveBeenCalled();
  });
});
