import type { Product } from "@cartura/contracts/catalog";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";

import { useImageEditor } from "@/features/management/shared/hooks/use-image-editor";
import { productImageProfile } from "@/features/management/shared/lib/image-edit";
import { MAX_PRODUCT_IMAGES } from "../lib/product-form";
import type { PendingProductImage } from "../types";
import {
  useDeletePendingProductImage,
  useUploadProductImage,
} from "./use-product-images";

type ProductImage = Product["images"][number];
type ManageableProductImage = ProductImage & { mediaAssetId: string };

export function useProductImageManager({
  product,
  productName,
  onUploadStart,
}: {
  product?: Product;
  productName: string;
  onUploadStart?: () => void;
}) {
  const upload = useUploadProductImage();
  const removePending = useDeletePendingProductImage();
  const [existingImages, setExistingImages] = useState<ManageableProductImage[]>(
    () => getManageableProductImages(product),
  );
  const [pendingImages, setPendingImages] = useState<PendingProductImage[]>([]);
  const pendingImagesRef = useRef(pendingImages);

  const editor = useImageEditor({
    profile: productImageProfile,
    onConfirm: async ({ file, editSpec, previewUrl }) => {
      onUploadStart?.();

      try {
        const asset = await upload.mutateAsync({ file, editSpec });
        if (!asset) {
          throw new Error("The upload did not return the selected image.");
        }

        URL.revokeObjectURL(previewUrl);
        setPendingImages((current) => [
          ...current,
          {
            asset,
            previewUrl: asset.canonicalUrl,
            altText: productName.trim() || undefined,
          },
        ]);
      } catch (error) {
        toast.error("Product image upload failed", {
          description:
            error instanceof Error
              ? error.message
              : "The selected image could not be uploaded.",
        });
        throw error;
      }
    },
  });

  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((image) =>
        URL.revokeObjectURL(image.previewUrl),
      );
    };
  }, []);

  const imageInputs = useMemo(
    () => [
      ...existingImages.map((image, index) => ({
        mediaAssetId: image.mediaAssetId,
        altText: image.altText ?? undefined,
        displayOrder: index,
      })),
      ...pendingImages.map((image, index) => ({
        mediaAssetId: image.asset.id,
        altText: image.altText,
        displayOrder: existingImages.length + index,
      })),
    ],
    [existingImages, pendingImages],
  );

  async function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    addFiles(files);
  }

  function addFiles(files: File[]) {
    if (!files.length) return;

    if (
      existingImages.length +
        pendingImages.length +
        editor.queueLength +
        files.length >
      MAX_PRODUCT_IMAGES
    ) {
      toast.error("Too many product images", {
        description: `A product can have at most ${MAX_PRODUCT_IMAGES} images.`,
      });
      return;
    }

    editor.addFiles(files);
  }

  function removeExistingImage(mediaAssetId: string) {
    setExistingImages((current) =>
      current.filter((image) => image.mediaAssetId !== mediaAssetId),
    );
  }

  async function removePendingImage(mediaAssetId: string) {
    const image = pendingImages.find(
      (candidate) => candidate.asset.id === mediaAssetId,
    );
    if (!image) return;

    const index = pendingImages.indexOf(image);
    setPendingImages((current) =>
      current.filter((candidate) => candidate.asset.id !== mediaAssetId),
    );

    try {
      await removePending.mutateAsync(mediaAssetId);
      URL.revokeObjectURL(image.previewUrl);
    } catch (error) {
      setPendingImages((current) => {
        if (current.some((candidate) => candidate.asset.id === mediaAssetId)) {
          return current;
        }
        const restored = [...current];
        restored.splice(index, 0, image);
        return restored;
      });
      toast.error("Image could not be removed", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    }
  }

  function reset() {
    pendingImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setPendingImages([]);
    setExistingImages(getManageableProductImages(product));
    editor.cancelAll();
  }

  return {
    existingImages,
    pendingImages,
    imageInputs,
    imageCount: imageInputs.length,
    editor,
    selectFiles,
    addFiles,
    removeExistingImage,
    removePendingImage,
    reset,
    isUploading: upload.isPending,
    isBusy: upload.isPending || editor.isOpen,
    isRemoving: removePending.isPending,
  };
}

function getManageableProductImages(
  product?: Product,
): ManageableProductImage[] {
  return (product?.images ?? []).filter(
    (image): image is ManageableProductImage => image.mediaAssetId !== null,
  );
}
