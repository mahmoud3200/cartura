"use client";

import { ZoomIn } from "lucide-react";

import type { ProductImage } from "@cartura/contracts/catalog";

import { cn } from "@/shared/lib/utils";

import { useProductGallery } from "../../hooks/use-product-gallery";
import { CatalogMedia } from "@/shared/ui/catalog-media";
import { ProductImageViewer } from "./product-image-viewer";

type ProductGalleryProps = {
  productName: string;
  images: ProductImage[];
};

export function ProductGallery({ productName, images }: ProductGalleryProps) {
  const gallery = useProductGallery(images);
  const selectedAlt =
    gallery.selectedImage?.altText ??
    `${productName} image ${gallery.selectedIndex + 1}`;

  return (
    <div className="min-w-0">
      <button
        type="button"
        aria-label={`Open ${selectedAlt}`}
        className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-muted/30 text-left transition-[border-color,box-shadow] duration-300 hover:border-foreground/25 hover:shadow-[0_20px_60px_color-mix(in_oklch,var(--foreground)_8%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={gallery.openViewer}
      >
        <CatalogMedia
          src={gallery.selectedImage?.imageUrl}
          alt={selectedAlt}
          fallbackIndex={gallery.selectedIndex}
          priority
          className="aspect-square rounded-none bg-transparent"
          imageClassName="object-contain"
          sizes="(min-width: 1024px) 55vw, 100vw"
        />
        <span className="absolute bottom-4 right-4 grid size-11 place-items-center rounded-xl border border-border bg-background/90 text-foreground shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
          <ZoomIn className="size-4" />
        </span>
      </button>

      {gallery.imageCount > 1 ? (
        <div
          role="group"
          aria-label="Choose a product image"
          className="mt-3 flex gap-3 overflow-x-auto pb-1"
        >
          {gallery.images.map((image, index) => {
            const isSelected = index === gallery.selectedIndex;
            const alt = image.altText ?? `${productName} image ${index + 1}`;

            return (
              <button
                key={image.id}
                type="button"
                aria-label={`Show ${alt}`}
                aria-pressed={isSelected}
                className={cn(
                  "group w-24 shrink-0 overflow-hidden rounded-xl border bg-muted/30 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-28",
                  isSelected
                    ? "border-primary ring-1 ring-primary"
                    : "border-border",
                )}
                onClick={() => gallery.selectImage(index)}
              >
                <CatalogMedia
                  src={image.imageUrl}
                  alt={alt}
                  fallbackIndex={index}
                  className="aspect-square rounded-none bg-transparent"
                  imageClassName="object-contain"
                  sizes="112px"
                />
              </button>
            );
          })}
        </div>
      ) : null}

      <ProductImageViewer productName={productName} gallery={gallery} />
    </div>
  );
}
