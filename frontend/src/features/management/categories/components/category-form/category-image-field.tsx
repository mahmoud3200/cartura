import Image from "next/image";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { type ChangeEvent, type RefObject } from "react";

import { Button } from "@/shared/ui/button";
import { ManagementFieldError } from "@/features/management/shared/components/management-form-field";
import { useFileDropzone } from "@/features/management/shared/hooks/use-file-dropzone";
import { cn } from "@/shared/lib/utils";

export function CategoryImageField({
  categoryName,
  existingImageUrl,
  previewUrl,
  hasUploadedImage,
  error,
  isUploading,
  isRemoving,
  onSelect,
  onDropFiles,
  onRemove,
}: {
  categoryName: string;
  existingImageUrl?: string | null;
  previewUrl: string | null;
  hasUploadedImage: boolean;
  error?: string;
  isUploading: boolean;
  isRemoving: boolean;
  onSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onDropFiles: (files: File[]) => void;
  onRemove: () => void;
}) {
  const imageUrl = previewUrl ?? existingImageUrl;
  const hasImage = Boolean(imageUrl || hasUploadedImage);
  const disabled = isUploading || isRemoving;
  const {
    inputRef,
    isDragging,
    openFilePicker,
    dropzoneProps,
  } = useFileDropzone({ disabled, onDropFiles });

  return (
    <div>
      <div
        {...dropzoneProps}
        className={cn(
          "relative overflow-hidden rounded-xl border border-border bg-muted/40 transition",
          isDragging && "border-primary bg-primary/5 ring-3 ring-primary/15",
        )}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={
              categoryName
                ? `${categoryName} category preview`
                : "Category image preview"
            }
            width={1200}
            height={400}
            unoptimized={Boolean(previewUrl)}
            className="aspect-3/1 w-full object-cover"
          />
        ) : (
          <CategoryImagePlaceholder
            disabled={disabled}
            onOpenFilePicker={openFilePicker}
          />
        )}

        {isUploading ? <CategoryImageProgress /> : null}

        {hasUploadedImage && !isUploading ? (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label="Remove uploaded image"
            onClick={onRemove}
            disabled={isRemoving}
            className="absolute right-3 top-3"
          >
            {isRemoving ? <LoaderCircle className="animate-spin" /> : <X />}
          </Button>
        ) : null}
      </div>

      <p className="mt-2 text-center text-xs text-muted-foreground">
        Drag and drop an image here, or use the button below.
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <ManagementFieldError message={error} />
          {hasUploadedImage ? (
            <p className="text-xs text-muted-foreground">
              Image uploaded and ready to save.
            </p>
          ) : null}
        </div>
        <CategoryImageInput
          inputRef={inputRef}
          hasImage={hasImage}
          disabled={disabled}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}

function CategoryImagePlaceholder({
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
      className="flex aspect-3/1 min-h-44 w-full cursor-pointer flex-col items-center justify-center gap-2 p-6 text-center disabled:cursor-not-allowed"
    >
      <ImagePlus className="size-6 text-muted-foreground" />
      <p className="text-sm font-medium">Add a wide category image</p>
      <p className="text-xs text-muted-foreground">
        PNG, JPG, or WebP. You can crop it or fit it to 1440x480.
      </p>
    </button>
  );
}

function CategoryImageProgress() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/75 backdrop-blur-sm">
      <span className="inline-flex items-center gap-2 text-sm font-medium">
        <LoaderCircle className="size-4 animate-spin" />
        Uploading image...
      </span>
    </div>
  );
}

function CategoryImageInput({
  inputRef,
  hasImage,
  disabled,
  onSelect,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  hasImage: boolean;
  disabled: boolean;
  onSelect: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted active:translate-y-px has-disabled:pointer-events-none has-disabled:opacity-50">
      <ImagePlus className="size-4" />
      {hasImage ? "Replace image" : "Choose image"}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={onSelect}
        disabled={disabled}
        className="sr-only"
      />
    </label>
  );
}
