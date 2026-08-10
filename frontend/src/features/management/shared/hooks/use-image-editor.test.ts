import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { productImageProfile } from "../lib/image-edit";
import { useImageEditor } from "./use-image-editor";

describe("useImageEditor", () => {
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn(() => "image-id") });
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn((file: File) => `blob:${file.name}`),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
  });

  it("queues files and revokes skipped or abandoned previews", () => {
    const { result } = renderHook(() =>
      useImageEditor({
        profile: productImageProfile,
        onConfirm: vi.fn(),
      }),
    );

    act(() => {
      result.current.addFiles([
        new File(["first"], "first.png", { type: "image/png" }),
        new File(["second"], "second.png", { type: "image/png" }),
      ]);
    });

    expect(result.current.queueLength).toBe(2);
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.skip());
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:first.png");
    expect(result.current.queueLength).toBe(1);

    act(() => result.current.cancelAll());
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:second.png");
    expect(result.current.isOpen).toBe(false);
  });

  it("passes the original file and fit instruction to the upload owner", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const file = new File(["image"], "product.webp", { type: "image/webp" });
    const { result } = renderHook(() =>
      useImageEditor({ profile: productImageProfile, onConfirm }),
    );

    act(() => {
      result.current.addFiles([file]);
      result.current.setMode("fit");
    });

    await act(async () => result.current.confirm());

    expect(onConfirm).toHaveBeenCalledWith({
      file,
      previewUrl: "blob:product.webp",
      editSpec: { mode: "fit", background: "#ffffff" },
    });
    expect(revokeObjectURL).not.toHaveBeenCalledWith("blob:product.webp");
    expect(result.current.isOpen).toBe(false);
  });
});
