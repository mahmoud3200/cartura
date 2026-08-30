import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProductImagesField } from "./product-images-field";

afterEach(cleanup);

const defaultProps = {
  pendingImages: [],
  isUploading: false,
  isRemoving: false,
  onSelect: vi.fn(),
  onDropFiles: vi.fn(),
  onRemoveExisting: vi.fn(),
  onRemovePending: vi.fn(),
};

describe("ProductImagesField", () => {
  it("opens the file picker from the empty drop surface", () => {
    const { container } = render(
      <ProductImagesField {...defaultProps} existingImages={[]} />,
    );
    const input = container.querySelector<HTMLInputElement>(
      'input[type="file"]',
    );
    expect(input).not.toBeNull();
    const click = vi.spyOn(input!, "click");

    fireEvent.click(
      screen.getByRole("button", { name: /add product images/i }),
    );

    expect(click).toHaveBeenCalledOnce();
  });

  it("does not open the picker when an existing image tile is clicked", () => {
    const { container } = render(
      <ProductImagesField
        {...defaultProps}
        existingImages={[
          {
            id: "image-1",
            mediaAssetId: "asset-1",
            imageUrl: "https://res.cloudinary.com/cartura/image/upload/image-1",
            altText: null,
            displayOrder: 0,
            createdAt: "2026-08-02T00:00:00.000Z",
            updatedAt: "2026-08-02T00:00:00.000Z",
          },
        ]}
      />,
    );
    const input = container.querySelector<HTMLInputElement>(
      'input[type="file"]',
    );
    expect(input).not.toBeNull();
    const click = vi.spyOn(input!, "click");

    fireEvent.click(screen.getByRole("img", { name: "Product image" }));

    expect(click).not.toHaveBeenCalled();
  });
});
