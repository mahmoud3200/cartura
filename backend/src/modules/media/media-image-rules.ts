import type { ImageEditSpec, MediaAssetUsage } from "@cartura/contracts/media";

import { httpError, validationError } from "../../shared/errors/index.js";

const maximumUpscaleFactor = 4;

const imageProfiles = {
  product_image: { aspectRatio: 1, width: 1440, height: 1440 },
  category_banner: { aspectRatio: 3, width: 1920, height: 640 },
} satisfies Record<
  MediaAssetUsage,
  { aspectRatio: number; width: number; height: number }
>;

export function assertImageEditIsUsable({
  image,
  edit,
  usage,
  fileName,
}: {
  image: { width: number; height: number };
  edit: ImageEditSpec;
  usage: MediaAssetUsage;
  fileName: string;
}) {
  const profile = imageProfiles[usage];
  let sourceWidth = image.width;
  let sourceHeight = image.height;

  if (edit.mode === "crop") {
    const { crop } = edit;
    if (crop.x + crop.width > 100 || crop.y + crop.height > 100) {
      throw validationError({
        file: fileName,
        crop: ["Crop coordinates must remain inside the image"],
      });
    }

    sourceWidth = image.width * (crop.width / 100);
    sourceHeight = image.height * (crop.height / 100);
    const cropAspectRatio = sourceWidth / sourceHeight;
    if (Math.abs(cropAspectRatio - profile.aspectRatio) > 0.02) {
      throw validationError({
        file: fileName,
        crop: [
          `The selected crop must use a ${profile.aspectRatio}:1 aspect ratio`,
        ],
      });
    }
  }

  const upscaleFactor =
    edit.mode === "crop"
      ? Math.max(profile.width / sourceWidth, profile.height / sourceHeight)
      : Math.min(profile.width / sourceWidth, profile.height / sourceHeight);

  if (upscaleFactor > maximumUpscaleFactor) {
    throw httpError(
      400,
      "IMAGE_UPSCALE_LIMIT_EXCEEDED",
      "The selected image area is too small for a clear final image",
      {
        file: fileName,
        upscaleFactor,
        maximumUpscaleFactor,
      },
    );
  }

  return { upscaleFactor };
}
