import { ImagePlus, LoaderCircle, X } from "lucide-react";
import Image from "next/image";
import { type ChangeEvent } from "react";

import { ManagementFieldError } from "@/features/management/shared/components/management-form-field";
import { useFileDropzone } from "@/features/management/shared/hooks/use-file-dropzone";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import type { ManagementProduct } from "../../api/products-api";
import { MAX_PRODUCT_IMAGES } from "../../lib/product-form";
import type { PendingProductImage } from "../../types";

export function ProductImagesField({
  existingImages,
  pendingImages,
  error,
  isUploading,
  isRemoving,
  onSelect,
  onDropFiles,
  onRemoveExisting,
  onRemovePending,
}: {
  existingImages: Array<
    ManagementProduct["images"][number] & { mediaAssetId: string }
  >;
  pendingImages: PendingProductImage[];
  error?: string;
  isUploading: boolean;
  isRemoving: boolean;
  onSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onDropFiles: (files: File[]) => void;
  onRemoveExisting: (mediaAssetId: string) => void;
  onRemovePending: (mediaAssetId: string) => void;
}) {
  const count = existingImages.length + pendingImages.length;
  const disabled = isUploading || isRemoving || count >= MAX_PRODUCT_IMAGES;
  const {
    inputRef,
    isDragging,
    openFilePicker,
    dropzoneProps,
  } = useFileDropzone({ disabled, onDropFiles });

  return (
    <div className="space-y-4">
      <div
        {...dropzoneProps}
        className={cn(
          "rounded-xl border border-dashed border-transparent p-1 transition",
          isDragging && "border-primary bg-primary/5 ring-3 ring-primary/15",
        )}
      >
        {count ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {existingImages.map((image) => (
              <ProductImageTile
                key={image.mediaAssetId}
                src={image.imageUrl}
                alt={image.altText ?? "Product image"}
                onRemove={() => onRemoveExisting(image.mediaAssetId)}
              />
            ))}
            {pendingImages.map((image) => (
              <ProductImageTile
                key={image.asset.id}
                src={image.previewUrl}
                alt={image.altText ?? "New product image"}
                unoptimized
                disabled={isRemoving}
                onRemove={() => onRemovePending(image.asset.id)}
              />
            ))}
            {isUploading ? <ProductImageUploadingTile /> : null}
          </div>
        ) : (
          <ProductImagesEmptyState
            disabled={disabled}
            onOpenFilePicker={openFilePicker}
          />
        )}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <ManagementFieldError message={error} />
          <p className="text-xs text-muted-foreground">
            {count} of {MAX_PRODUCT_IMAGES} images
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Drag and drop one or more images into the area above.
          </p>
        </div>
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted active:translate-y-px has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50">
          <ImagePlus className="size-4" />
          Add images
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={onSelect}
            disabled={disabled}
            className="sr-only"
          />
        </label>
      </div>
    </div>
  );
}

function ProductImageTile({
  src,
  alt,
  unoptimized = false,
  disabled = false,
  onRemove,
}: {
  src?: string | null;
  alt: string;
  unoptimized?: boolean;
  disabled?: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-muted">
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={400}
          height={400}
          unoptimized={unoptimized}
          className="aspect-square w-full object-cover"
        />
      ) : (
        <div className="flex aspect-square items-center justify-center text-xs text-muted-foreground">
          Image attached
        </div>
      )}
      <Button
        type="button"
        variant="secondary"
        size="icon-sm"
        aria-label="Remove product image"
        onClick={onRemove}
        disabled={disabled}
        className="absolute right-2 top-2"
      >
        <X />
      </Button>
    </div>
  );
}

function ProductImageUploadingTile() {
  return (
    <div className="flex aspect-square items-center justify-center rounded-xl border border-border bg-muted/60">
      <span className="inline-flex items-center gap-2 text-sm font-medium">
        <LoaderCircle className="size-4 animate-spin" />
        Uploading...
      </span>
    </div>
  );
}

function ProductImagesEmptyState({
  disabled,
  onOpenFilePicker,
}: {
  disabled: boolean;
  onOpenFilePicker: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpenFilePicker}
      disabled={disabled}
      className="flex min-h-44 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center disabled:cursor-not-allowed"
    >
      <ImagePlus className="size-6 text-muted-foreground" />
      <p className="text-sm font-medium">Add product images</p>
      <p className="text-xs text-muted-foreground">
        PNG, JPG, or WebP. You can crop or fit each image to a square.
      </p>
    </button>
  );
}
