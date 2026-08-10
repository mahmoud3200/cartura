import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";

import type { ManagementMediaAsset } from "@/features/management/shared/api/media-api";
import { useImageEditor } from "@/features/management/shared/hooks/use-image-editor";
import { categoryBannerProfile } from "@/features/management/shared/lib/image-edit";
import {
  useDeletePendingCategoryBanner,
  useUploadCategoryBanner,
} from "./use-category-banner";

export function useCategoryBannerManager({
  onUploadStart,
}: {
  onUploadStart?: () => void;
} = {}) {
  const upload = useUploadCategoryBanner();
  const remove = useDeletePendingCategoryBanner();
  const [asset, setAsset] = useState<ManagementMediaAsset | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef(previewUrl);

  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const editor = useImageEditor({
    profile: categoryBannerProfile,
    onConfirm: async ({ file, editSpec, previewUrl: nextPreviewUrl }) => {
      onUploadStart?.();

      try {
        const nextAsset = await upload.mutateAsync({ file, editSpec });
        if (!nextAsset) {
          throw new Error("The upload did not return a category image.");
        }

        const previousAsset = asset;
        URL.revokeObjectURL(nextPreviewUrl);
        setAsset(nextAsset);
        setPreviewUrl(nextAsset.canonicalUrl);
        if (previousAsset) void cleanUpReplacedAsset(previousAsset.id);
      } catch (error) {
        toast.error("Category image upload failed", {
          description:
            error instanceof Error
              ? error.message
              : "The selected image could not be uploaded.",
        });
        throw error;
      }
    },
  });

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    addFiles([file]);
  }

  function addFiles(files: File[]) {
    const file = files[0];
    if (!file) return;

    editor.addFiles([file]);
  }

  async function cleanUpReplacedAsset(assetId: string) {
    try {
      await remove.mutateAsync(assetId);
    } catch {
      toast.error("Previous image cleanup failed", {
        description:
          "The new image is ready, but the previous upload could not be removed.",
      });
    }
  }

  async function removeAsset() {
    if (!asset) return;

    const previousAsset = asset;
    const previousPreviewUrl = previewUrl;
    setAsset(null);
    setPreviewUrl(null);

    try {
      await remove.mutateAsync(previousAsset.id);
      if (previousPreviewUrl) URL.revokeObjectURL(previousPreviewUrl);
    } catch (error) {
      setAsset(previousAsset);
      setPreviewUrl(previousPreviewUrl);
      toast.error("Image could not be removed", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    }
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    editor.cancelAll();
    setAsset(null);
    setPreviewUrl(null);
  }

  return {
    asset,
    previewUrl,
    editor,
    selectFile,
    addFiles,
    removeAsset,
    reset,
    isUploading: upload.isPending,
    isBusy: upload.isPending || editor.isOpen,
    isRemoving: remove.isPending,
  };
}
