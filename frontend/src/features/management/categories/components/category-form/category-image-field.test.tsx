import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CategoryImageField } from "./category-image-field";

afterEach(cleanup);

describe("CategoryImageField", () => {
  it("opens the file picker from the empty drop surface", () => {
    const { container } = render(
      <CategoryImageField
        categoryName=""
        previewUrl={null}
        hasUploadedImage={false}
        isUploading={false}
        isRemoving={false}
        onSelect={vi.fn()}
        onDropFiles={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    const input = container.querySelector<HTMLInputElement>(
      'input[type="file"]',
    );
    expect(input).not.toBeNull();
    const click = vi.spyOn(input!, "click");

    fireEvent.click(
      screen.getByRole("button", { name: /add a wide category image/i }),
    );

    expect(click).toHaveBeenCalledOnce();
  });
});
