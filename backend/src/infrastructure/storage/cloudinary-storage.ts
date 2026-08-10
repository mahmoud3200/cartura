import { randomUUID } from "node:crypto";
import type { UploadApiResponse } from "cloudinary";

import type { ImageEditSpec, MediaAssetUsage } from "@cartura/contracts/media";
import { env } from "../../config/env.js";
import { getCloudinaryClient } from "./cloudinary.client.js";

export type ImageVariant = {
  url: string;
  width: number;
  height: number;
  format: "webp";
};

export type UploadedCloudinaryImage = {
  publicId: string;
  secureUrl: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  variants: Record<string, ImageVariant>;
  canonicalUrl: string;
};

type ImageDimensions = {
  width: number;
  height: number;
};

type PercentCrop = Extract<ImageEditSpec, { mode: "crop" }>["crop"];

export async function uploadImageBuffer(
  buffer: Buffer,
  usage: MediaAssetUsage,
  editSpec: ImageEditSpec,
  sourceDimensions: ImageDimensions,
): Promise<UploadedCloudinaryImage> {
  const client = getCloudinaryClient();
  const publicId = `${usage}/${randomUUID()}`;
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        folder: env.CLOUDINARY_UPLOAD_FOLDER,
        public_id: publicId,
        resource_type: "image",
        overwrite: false,
      },
      (error, response) => {
        if (error || !response) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve(response);
      },
    );

    stream.end(buffer);
  });

  const variants = buildImageVariants(
    result.public_id,
    usage,
    editSpec,
    sourceDimensions,
  );
  const canonicalUrl =
    usage === "product_image"
      ? variants["square1080"]!.url
      : variants["banner1440"]!.url;

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    format: result.format,
    bytes: result.bytes,
    width: result.width,
    height: result.height,
    variants,
    canonicalUrl,
  };
}

export async function deleteImage(publicId: string): Promise<void> {
  const client = getCloudinaryClient();
  await client.uploader.destroy(publicId, { resource_type: "image" });
}

function buildImageVariants(
  publicId: string,
  usage: MediaAssetUsage,
  editSpec: ImageEditSpec,
  sourceDimensions: ImageDimensions,
): Record<string, ImageVariant> {
  if (usage === "product_image") {
    return {
      square1080: buildVariant(
        publicId,
        1080,
        1080,
        editSpec,
        sourceDimensions,
      ),
      square1440: buildVariant(
        publicId,
        1440,
        1440,
        editSpec,
        sourceDimensions,
      ),
    };
  }

  return {
    banner1440: buildVariant(
      publicId,
      1440,
      480,
      editSpec,
      sourceDimensions,
    ),
    banner1920: buildVariant(
      publicId,
      1920,
      640,
      editSpec,
      sourceDimensions,
    ),
  };
}

function buildVariant(
  publicId: string,
  width: number,
  height: number,
  editSpec: ImageEditSpec,
  sourceDimensions: ImageDimensions,
): ImageVariant {
  const client = getCloudinaryClient();
  const editTransformation = buildCloudinaryEditTransformation(
    width,
    height,
    editSpec,
    sourceDimensions,
  );

  return {
    url: client.url(publicId, {
      secure: true,
      transformation: [
        ...editTransformation,
        { quality: "auto", fetch_format: "webp" },
      ],
    }),
    width,
    height,
    format: "webp",
  };
}

export function buildCloudinaryEditTransformation(
  outputWidth: number,
  outputHeight: number,
  editSpec: ImageEditSpec,
  sourceDimensions: ImageDimensions,
) {
  if (editSpec.mode === "fit") {
    return [
      { angle: "auto" },
      {
        background: `rgb:${editSpec.background.slice(1)}`,
        crop: "pad",
        gravity: "center",
        width: outputWidth,
        height: outputHeight,
      },
    ];
  }

  const crop = toCloudinaryPixelCrop(editSpec.crop, sourceDimensions);

  return [
    { angle: "auto" },
    { crop: "crop", ...crop },
    {
      crop: "fill",
      gravity: "center",
      width: outputWidth,
      height: outputHeight,
    },
  ];
}

export function toCloudinaryPixelCrop(
  crop: PercentCrop,
  source: ImageDimensions,
) {
  const left = percentageToPixels(crop.x, source.width);
  const top = percentageToPixels(crop.y, source.height);
  const right = percentageToPixels(crop.x + crop.width, source.width);
  const bottom = percentageToPixels(crop.y + crop.height, source.height);

  return {
    x: left,
    y: top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
  };
}

function percentageToPixels(percentage: number, dimension: number) {
  return Math.round((percentage / 100) * dimension);
}
