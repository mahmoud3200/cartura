"use client";

import { useCallback, useEffect, useState } from "react";

import type { ProductImage } from "@cartura/contracts/catalog";

export function useProductGallery(images: ProductImage[]) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const imageCount = images.length;

  const selectImage = useCallback(
    (index: number) => {
      if (index < 0 || index >= imageCount) return;

      setSelectedIndex(index);
    },
    [imageCount],
  );

  const showPrevious = useCallback(() => {
    if (imageCount === 0) return;

    setSelectedIndex((current) => (current - 1 + imageCount) % imageCount);
  }, [imageCount]);

  const showNext = useCallback(() => {
    if (imageCount === 0) return;

    setSelectedIndex((current) => (current + 1) % imageCount);
  }, [imageCount]);

  const openViewer = useCallback(() => {
    setIsViewerOpen(true);
  }, []);

  const closeViewer = useCallback(() => {
    setIsViewerOpen(false);
  }, []);

  useEffect(() => {
    if (!isViewerOpen || imageCount < 2) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrevious();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [imageCount, isViewerOpen, showNext, showPrevious]);

  return {
    images,
    imageCount,
    selectedImage: images[selectedIndex],
    selectedIndex,
    isViewerOpen,
    selectImage,
    showPrevious,
    showNext,
    openViewer,
    closeViewer,
  };
}

export type ProductGalleryController = ReturnType<typeof useProductGallery>;
