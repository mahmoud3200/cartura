"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/shared/lib/utils";

const fallbackImages = [
  "/visuals/collection-home.svg",
  "/visuals/collection-travel.svg",
  "/visuals/collection-studio.svg",
  "/visuals/collection-limited.svg",
];

type CatalogMediaProps = {
  src?: string | null;
  alt: string;
  fallbackIndex?: number;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  sizes?: string;
};

export function CatalogMedia({
  src,
  alt,
  fallbackIndex = 0,
  priority = false,
  className,
  imageClassName,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
}: CatalogMediaProps) {
  const [hasError, setHasError] = useState(false);
  const fallbackImage = getFallbackImage(fallbackIndex);

  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-muted", className)}>
      <Image
        src={hasError ? fallbackImage : src || fallbackImage}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn(
          "object-cover transition duration-700 ease-out group-hover:scale-105",
          imageClassName,
        )}
        onError={() => setHasError(true)}
      />
    </div>
  );
}

export function getFallbackImage(index: number) {
  return fallbackImages[Math.abs(index) % fallbackImages.length] ?? fallbackImages[0];
}
