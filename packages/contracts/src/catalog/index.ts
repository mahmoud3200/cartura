import { z } from "zod";
import {
  paginationMetadataSchema,
  paginationQuerySchema,
} from "../common/index.js";

const optionalTextSchema = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional();

const booleanQuerySchema = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

const slugSchema = (max: number) =>
  z
    .string()
    .trim()
    .min(2)
    .max(max)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and single hyphens",
    );

export const listCategoriesQuerySchema = paginationQuerySchema.and(
  z.object({
    q: z.string().trim().min(1).max(120).optional(),
    parentCategoryId: z.uuid().optional(),
  })
);

export const createCategoryRequestSchema = z.object({
  parentCategoryId: z.uuid().optional(),
  name: z.string().trim().min(2).max(120),
  slug: slugSchema(140),
  description: optionalTextSchema,
  imageAssetId: z.uuid(),
});

export const updateCategoryRequestSchema = z.object({
  parentCategoryId: z.uuid().nullable().optional(),
  name: z.string().trim().min(2).max(120).optional(),
  slug: slugSchema(140).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  imageAssetId: z.uuid().optional(),
}).strict();

export const listProductsQuerySchema = paginationQuerySchema.and(z.object({
  q: z.string().trim().min(1).max(120).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  inStock: booleanQuerySchema.optional(),
}));

export const productImageInputSchema = z.object({
  mediaAssetId: z.uuid(),
  altText: z.string().trim().max(200).optional(),
  displayOrder: z.number().int().min(0).default(0),
});

export const createProductRequestSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: slugSchema(180),
  description: optionalTextSchema,
  sku: z.string().trim().min(1).max(80),
  price: z.number().nonnegative(),
  stockQuantity: z.number().int().min(0).default(0),
  categoryIds: z.array(z.uuid()).default([]),
  images: z.array(productImageInputSchema).min(1),
});

export const updateProductRequestSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  slug: slugSchema(180).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  sku: z.string().trim().min(1).max(80).optional(),
  price: z.number().nonnegative().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  isDeleted: z.boolean().optional(),
  categoryIds: z.array(z.uuid()).optional(),
  images: z.array(productImageInputSchema).min(1).optional(),
});

export const updateProductInventoryRequestSchema = z.object({
  stockQuantity: z.number().int().min(0),
});

export const paginationResponseSchema = paginationMetadataSchema;

const nullableStringSchema = z.string().nullable();

export const categoryChildSchema = z.object({
  id: z.string(),
  parentCategoryId: nullableStringSchema,
  name: z.string(),
  slug: z.string(),
  description: nullableStringSchema,
  imageUrl: z.string(),
  imageAssetId: z.uuid(),
  isDeleted: z.literal(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const parentCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

export const categorySchema = categoryChildSchema.extend({
  parentCategoryName: nullableStringSchema.optional(),
  parentCategory: z.array(parentCategorySchema).nullable().optional(),
  children: z.array(categoryChildSchema).optional(),
});

export const productCategorySchema = z.object({
  id: z.string(),
  parentCategoryId: nullableStringSchema,
  name: z.string(),
  slug: z.string(),
  description: nullableStringSchema,
  imageUrl: z.string(),
  isDeleted: z.literal(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const productImageSchema = z.object({
  id: z.string(),
  mediaAssetId: nullableStringSchema,
  imageUrl: nullableStringSchema,
  altText: nullableStringSchema,
  displayOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: nullableStringSchema,
  sku: z.string(),
  price: z.number(),
  stockQuantity: z.number(),
  isDeleted: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  categories: z.array(productCategorySchema),
  images: z.array(productImageSchema),
});

export const categoryListResponseSchema = z.object({
  data: z.array(categorySchema),
  pagination: paginationResponseSchema,
});

export const categoryResponseSchema = z.object({
  data: categorySchema,
});

export const productListResponseSchema = z.object({
  data: z.array(productSchema),
  pagination: paginationResponseSchema,
});

export const productResponseSchema = z.object({
  data: productSchema,
});

export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;
export type CreateCategoryRequest = z.infer<typeof createCategoryRequestSchema>;
export type UpdateCategoryRequest = z.infer<typeof updateCategoryRequestSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type ProductImageInput = z.infer<typeof productImageInputSchema>;
export type CreateProductRequest = z.infer<typeof createProductRequestSchema>;
export type UpdateProductRequest = z.infer<typeof updateProductRequestSchema>;
export type UpdateProductInventoryRequest = z.infer<
  typeof updateProductInventoryRequestSchema
>;
export type PaginationResponse = z.infer<typeof paginationResponseSchema>;
export type CategoryChild = z.infer<typeof categoryChildSchema>;
export type Category = z.infer<typeof categorySchema>;
export type ProductCategory = z.infer<typeof productCategorySchema>;
export type ProductImage = z.infer<typeof productImageSchema>;
export type Product = z.infer<typeof productSchema>;
export type CategoryListResponse = z.infer<typeof categoryListResponseSchema>;
export type CategoryResponse = z.infer<typeof categoryResponseSchema>;
export type ProductListResponse = z.infer<typeof productListResponseSchema>;
export type ProductResponse = z.infer<typeof productResponseSchema>;
