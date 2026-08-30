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
    }).strict(),
  }).strict(),
  z.object({
    mode: z.literal("fit"),
    background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }).strict(),
]);

export const imageEditSpecsSchema = z.array(imageEditSpecSchema).min(1).max(10);

export const mediaAssetVariantSchema = z.object({
  url: z.url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  format: z.literal("webp"),
}).strict();

export const mediaAssetIdParamsSchema = z.object({
  mediaAssetId: z.uuid(),
}).strict();

export const mediaAssetResponseSchema = z.object({
  id: z.uuid(),
  provider: z.literal("cloudinary"),
  publicId: z.string(),
  secureUrl: z.url(),
  canonicalUrl: z.url(),
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
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  attachedAt: z.iso.datetime().nullable(),
}).strict();

export const mediaAssetListResponseSchema = dataListResponseSchema(
  mediaAssetResponseSchema,
);

export type MediaAssetUsage = z.infer<typeof mediaAssetUsageSchema>;
export type MediaAssetStatus = z.infer<typeof mediaAssetStatusSchema>;
export type MediaAssetIdParams = z.infer<typeof mediaAssetIdParamsSchema>;
export type ImageEditSpec = z.infer<typeof imageEditSpecSchema>;
export type MediaAssetResponse = z.infer<typeof mediaAssetResponseSchema>;
export type MediaAssetListResponse = z.infer<
  typeof mediaAssetListResponseSchema
>;
