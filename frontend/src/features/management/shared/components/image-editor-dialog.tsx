"use client";

import { Dialog } from "@base-ui/react/dialog";
import { AlertTriangle, Crop, Expand, LoaderCircle, X } from "lucide-react";

import { Button } from "@/shared/ui/button";
import type { ImageEditorController } from "../hooks/use-image-editor";
import { ImageEditorCanvas } from "../ui/image-editor-canvas";

export function ImageEditorDialog({
  editor,
}: {
  editor: ImageEditorController;
}) {
  const item = editor.activeItem;

  return (
    <Dialog.Root
      open={editor.isOpen}
      disablePointerDismissal={editor.isSaving}
      onOpenChange={(open) => {
        if (!open) editor.cancelAll();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/45 backdrop-blur-sm" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 sm:p-6">
          <Dialog.Popup className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl overflow-y-auto rounded-2xl border border-border bg-background p-4 shadow-2xl outline-none sm:max-h-[calc(100dvh-3rem)] sm:p-6">
            <header className="mb-5 flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-lg font-semibold">
                  Prepare {editor.profile.label.toLowerCase()}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  Crop the important area or fit the complete image on a solid canvas.
                </Dialog.Description>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close image editor"
                disabled={editor.isSaving}
                onClick={editor.cancelAll}
              >
                <X />
              </Button>
            </header>

            {item ? (
              <ImageEditorCanvas
                imageUrl={item.previewUrl}
                mode={editor.mode}
                aspectRatio={editor.profile.aspectRatio}
                crop={editor.crop}
                zoom={editor.zoom}
                background={editor.background}
                onCropChange={editor.setCrop}
                onZoomChange={editor.setZoom}
                onCropComplete={editor.setCroppedArea}
              />
            ) : null}

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={editor.mode === "crop" ? "default" : "outline"}
                    onClick={() => editor.setMode("crop")}
                  >
                    <Crop /> Crop
                  </Button>
                  <Button
                    type="button"
                    variant={editor.mode === "fit" ? "default" : "outline"}
                    onClick={() => editor.setMode("fit")}
                  >
                    <Expand /> Fit image
                  </Button>
                </div>

                {editor.mode === "crop" ? (
                  <label className="block max-w-md text-sm font-medium">
                    Zoom
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.01"
                      value={editor.zoom}
                      onChange={(event) => editor.setZoom(Number(event.target.value))}
                      className="mt-2 block w-full accent-primary"
                    />
                  </label>
                ) : (
                  <label className="inline-flex items-center gap-3 text-sm font-medium">
                    Canvas color
                    <input
                      type="color"
                      value={editor.background}
                      onChange={(event) => editor.setBackground(event.target.value)}
                      className="size-9 cursor-pointer rounded-lg border border-border bg-background p-1"
                    />
                    <span className="font-mono text-xs text-muted-foreground">
                      {editor.background.toUpperCase()}
                    </span>
                  </label>
                )}

                <ImageQualityMessage editor={editor} />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="mr-2 text-xs text-muted-foreground">
                  {editor.queueLength} image{editor.queueLength === 1 ? "" : "s"} remaining
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={editor.isSaving}
                  onClick={editor.skip}
                >
                  Skip
                </Button>
                <Button
                  type="button"
                  disabled={!editor.canConfirm}
                  onClick={() => void editor.confirm()}
                >
                  {editor.isSaving ? (
                    <><LoaderCircle className="animate-spin" /> Uploading...</>
                  ) : (
                    "Use image"
                  )}
                </Button>
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ImageQualityMessage({ editor }: { editor: ImageEditorController }) {
  if (!editor.sourceDimensions) return null;

  const resolution = `${editor.profile.targetWidth}×${editor.profile.targetHeight}`;
  if (!editor.hasQualityWarning) {
    return (
      <p className="text-xs text-muted-foreground">
        Final output: {resolution}. No enlargement is needed.
      </p>
    );
  }

  return (
    <p
      className={
        editor.exceedsUpscaleLimit
          ? "flex items-start gap-2 text-xs text-destructive"
          : "flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300"
      }
    >
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
      {editor.exceedsUpscaleLimit
        ? "This selection is too small. Choose a larger crop area or a higher-resolution image."
        : `This selection will be enlarged about ${editor.upscaleFactor.toFixed(1)}× and may look softer at ${resolution}.`}
    </p>
  );
}
