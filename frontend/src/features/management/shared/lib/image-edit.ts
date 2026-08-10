import type { ImageEditSpec, MediaAssetUsage } from "@cartura/contracts/media";

export type ImageEditorProfile = {
  usage: MediaAssetUsage;
  label: string;
  aspectRatio: number;
  targetWidth: number;
  targetHeight: number;
  qualityWidth: number;
  qualityHeight: number;
};

export const productImageProfile: ImageEditorProfile = {
  usage: "product_image",
  label: "Square product image",
  aspectRatio: 1,
  targetWidth: 1080,
  targetHeight: 1080,
  qualityWidth: 1440,
  qualityHeight: 1440,
};

export const categoryBannerProfile: ImageEditorProfile = {
  usage: "category_banner",
  label: "Wide category banner",
  aspectRatio: 3,
  targetWidth: 1440,
  targetHeight: 480,
  qualityWidth: 1920,
  qualityHeight: 640,
};

export type ImageDimensions = { width: number; height: number };
export type PercentCrop = Extract<ImageEditSpec, { mode: "crop" }>["crop"];

export function getUpscaleFactor(
  source: ImageDimensions | null,
  profile: ImageEditorProfile,
  editSpec: ImageEditSpec | null,
) {
  if (!source || !editSpec) return 0;

  if (editSpec.mode === "fit") {
    return Math.min(
      profile.qualityWidth / source.width,
      profile.qualityHeight / source.height,
    );
  }

  const cropWidth = source.width * (editSpec.crop.width / 100);
  const cropHeight = source.height * (editSpec.crop.height / 100);

  return Math.max(
    profile.qualityWidth / cropWidth,
    profile.qualityHeight / cropHeight,
  );
}

export function roundPercentCrop(crop: PercentCrop): PercentCrop {
  return {
    x: round(crop.x),
    y: round(crop.y),
    width: round(crop.width),
    height: round(crop.height),
  };
}

function round(value: number) {
  return Math.round(value * 10_000) / 10_000;
}
