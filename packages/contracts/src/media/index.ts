import { z } from "zod";
import { dataListResponseSchema } from "../common/index.js";

export const mediaAssetUsageSchema = z.enum([
  "product_image",
  "category_banner",
]);

export const mediaAssetStatusSchema = z.enum(["pending", "attached"]);

const cropPercentSchema = z.number().finite().min(0).max(100);

export const imageEditSpecSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("crop"),
    crop: z.object({
      x: cropPercentSchema,
      y: cropPercentSchema,
      width: cropPercentSchema.positive(),
      height: cropPercentSchema.positive(),
    }),
  }),
  z.object({
    mode: z.literal("fit"),
    background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
]);

export const imageEditSpecsSchema = z.array(imageEditSpecSchema).min(1).max(10);

export const mediaAssetVariantSchema = z.object({
  url: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  format: z.literal("webp"),
});

export const mediaAssetResponseSchema = z.object({
  id: z.uuid(),
  provider: z.literal("cloudinary"),
  publicId: z.string(),
  secureUrl: z.string(),
  canonicalUrl: z.string(),
  usage: mediaAssetUsageSchema,
  status: mediaAssetStatusSchema,
  mimeType: z.string(),
  format: z.string(),
  bytes: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  editSpec: imageEditSpecSchema.nullable(),
  variants: z.record(z.string(), mediaAssetVariantSchema),
  uploadedBy: z.uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  attachedAt: z.string().nullable(),
});

export const mediaAssetListResponseSchema = dataListResponseSchema(
  mediaAssetResponseSchema,
);

export type MediaAssetUsage = z.infer<typeof mediaAssetUsageSchema>;
export type MediaAssetStatus = z.infer<typeof mediaAssetStatusSchema>;
export type ImageEditSpec = z.infer<typeof imageEditSpecSchema>;
export type MediaAssetResponse = z.infer<typeof mediaAssetResponseSchema>;
export type MediaAssetListResponse = z.infer<
  typeof mediaAssetListResponseSchema
>;
