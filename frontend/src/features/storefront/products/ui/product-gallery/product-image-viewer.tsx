"use client";

import { Dialog } from "@base-ui/react/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";

import { Button } from "@/shared/ui/button";

import { useImagePanZoom } from "../../hooks/use-image-pan-zoom";
import type { ProductGalleryController } from "../../hooks/use-product-gallery";
import { CatalogMedia } from "@/shared/ui/catalog-media";

type ProductImageViewerProps = {
  productName: string;
  gallery: ProductGalleryController;
};

const navigationButtonClassName =
  "size-11 border-white/20 bg-zinc-950/80 text-white shadow-xl shadow-black/35 backdrop-blur-md hover:bg-zinc-900/90 hover:text-white dark:border-white/20 dark:bg-zinc-950/80 dark:hover:bg-zinc-900/90";

export function ProductImageViewer({
  productName,
  gallery,
}: ProductImageViewerProps) {
  const selectedAlt =
    gallery.selectedImage?.altText ??
    `${productName} image ${gallery.selectedIndex + 1}`;
  const panZoom = useImagePanZoom(
    `${gallery.isViewerOpen}:${gallery.selectedIndex}`,
  );

  return (
    <Dialog.Root
      open={gallery.isViewerOpen}
      onOpenChange={(open) => {
        if (!open) gallery.closeViewer();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md" />
        <Dialog.Viewport className="fixed inset-0 z-50">
          <Dialog.Popup className="fixed inset-0 overflow-hidden bg-transparent text-foreground outline-none">
            <Dialog.Title className="sr-only">
              {productName} image viewer
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Use the mouse wheel to zoom, drag to pan, and the arrow keys to
              change images.
            </Dialog.Description>

            <div
              ref={panZoom.viewportRef}
              className={
                panZoom.isDragging
                  ? "absolute inset-0 cursor-grabbing touch-none overflow-hidden"
                  : panZoom.canZoomOut
                    ? "absolute inset-0 cursor-grab touch-none overflow-hidden"
                    : "absolute inset-0 cursor-zoom-in touch-none overflow-hidden"
              }
              {...panZoom.interactionProps}
            >
              <div
                ref={panZoom.contentRef}
                className="absolute inset-x-4 bottom-20 top-16 will-change-transform sm:inset-x-16 sm:bottom-24 sm:top-20 lg:inset-x-24"
              >
                <CatalogMedia
                  src={gallery.selectedImage?.imageUrl}
                  alt={selectedAlt}
                  fallbackIndex={gallery.selectedIndex}
                  className="absolute inset-0 rounded-none bg-transparent"
                  imageClassName="pointer-events-none select-none object-contain transition-none group-hover:scale-100"
                  sizes="100vw"
                />
              </div>
            </div>

            <div className="pointer-events-none absolute left-4 top-4 sm:left-6 sm:top-6">
              <p className="max-w-[min(60vw,32rem)] truncate font-semibold">
                {productName}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {gallery.selectedIndex + 1} / {Math.max(1, gallery.imageCount)}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Close image viewer"
              className="absolute right-4 top-4 bg-background/80 shadow-lg backdrop-blur-md sm:right-6 sm:top-6"
              onClick={gallery.closeViewer}
            >
              <X />
            </Button>

            {gallery.imageCount > 1 ? (
              <>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 sm:left-6">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Show previous image"
                    className={navigationButtonClassName}
                    onClick={gallery.showPrevious}
                  >
                    <ChevronLeft />
                  </Button>
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 sm:right-6">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Show next image"
                    className={navigationButtonClassName}
                    onClick={gallery.showNext}
                  >
                    <ChevronRight />
                  </Button>
                </div>
              </>
            ) : null}

            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-xl border border-border bg-background/80 p-1.5 shadow-xl backdrop-blur-md sm:bottom-6">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Zoom out"
                disabled={!panZoom.canZoomOut}
                onClick={panZoom.zoomOut}
              >
                <Minus />
              </Button>
              <Button
                type="button"
                variant="ghost"
                aria-label="Reset zoom"
                className="min-w-24 font-mono text-xs tabular-nums"
                disabled={!panZoom.canZoomOut}
                onClick={panZoom.reset}
              >
                <RotateCcw />
                {panZoom.zoomPercent}%
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Zoom in"
                disabled={!panZoom.canZoomIn}
                onClick={panZoom.zoomIn}
              >
                <Plus />
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
