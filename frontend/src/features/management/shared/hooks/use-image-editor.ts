"use client";

import type { ImageEditSpec } from "@cartura/contracts/media";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Area, Point } from "react-easy-crop";

import {
  getUpscaleFactor,
  roundPercentCrop,
  type ImageDimensions,
  type ImageEditorProfile,
} from "../lib/image-edit";

type EditorItem = {
  id: string;
  file: File;
  previewUrl: string;
};

export type ImageEditorConfirmInput = {
  file: File;
  previewUrl: string;
  editSpec: ImageEditSpec;
};

export function useImageEditor({
  profile,
  onConfirm,
}: {
  profile: ImageEditorProfile;
  onConfirm: (input: ImageEditorConfirmInput) => Promise<void>;
}) {
  const [queue, setQueue] = useState<EditorItem[]>([]);
  const queueRef = useRef(queue);
  const [mode, setMode] = useState<ImageEditSpec["mode"]>("crop");
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [background, setBackground] = useState("#ffffff");
  const [sourceDimensions, setSourceDimensions] =
    useState<ImageDimensions | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const activeItem = queue[0] ?? null;

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    return () => {
      queueRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  useEffect(() => {
    if (!activeItem) return;

    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      setSourceDimensions({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.src = activeItem.previewUrl;

    return () => {
      cancelled = true;
    };
  }, [activeItem]);

  const editSpec = useMemo<ImageEditSpec | null>(() => {
    if (mode === "fit") return { mode, background };
    if (!croppedArea) return null;
    return { mode, crop: roundPercentCrop(croppedArea) };
  }, [background, croppedArea, mode]);

  const upscaleFactor = getUpscaleFactor(sourceDimensions, profile, editSpec);
  const hasQualityWarning = upscaleFactor > 1;
  const exceedsUpscaleLimit = upscaleFactor > 4;

  function addFiles(files: File[]) {
    if (!files.length) return;
    if (queueRef.current.length === 0) resetEditorState();

    setQueue((current) => [
      ...current,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  }

  function removeActive({ revoke = true } = {}) {
    resetEditorState();
    setQueue((current) => {
      const [active, ...remaining] = current;
      if (active && revoke) URL.revokeObjectURL(active.previewUrl);
      return remaining;
    });
  }

  function cancelAll() {
    if (isSaving) return;
    resetEditorState();
    setQueue((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return [];
    });
  }

  async function confirm() {
    if (!activeItem || !editSpec || exceedsUpscaleLimit || isSaving) return;

    setIsSaving(true);
    try {
      await onConfirm({
        file: activeItem.file,
        previewUrl: activeItem.previewUrl,
        editSpec,
      });
      removeActive({ revoke: false });
    } catch {
      return;
    } finally {
      setIsSaving(false);
    }
  }

  function resetEditorState() {
    setMode("crop");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedArea(null);
    setBackground("#ffffff");
    setSourceDimensions(null);
  }

  return {
    profile,
    activeItem,
    queueLength: queue.length,
    isOpen: Boolean(activeItem),
    mode,
    setMode,
    crop,
    setCrop,
    zoom,
    setZoom,
    setCroppedArea,
    background,
    setBackground,
    sourceDimensions,
    upscaleFactor,
    hasQualityWarning,
    exceedsUpscaleLimit,
    canConfirm: Boolean(editSpec) && !exceedsUpscaleLimit && !isSaving,
    isSaving,
    addFiles,
    skip: () => removeActive(),
    cancelAll,
    confirm,
  };
}

export type ImageEditorController = ReturnType<typeof useImageEditor>;
