import { z } from "zod";

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

export const catalogPaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const listCategoriesQuerySchema = z.object({
  parentCategoryId: z.uuid().optional(),
});

export const createCategoryRequestSchema = z.object({
  parentCategoryId: z.uuid().optional(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(140),
  description: optionalTextSchema,
  imageUrl: optionalTextSchema,
});

export const updateCategoryRequestSchema = z.object({
  parentCategoryId: z.uuid().nullable().optional(),
  name: z.string().trim().min(2).max(120).optional(),
  slug: z.string().trim().min(2).max(140).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  imageUrl: z.string().trim().max(2048).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const listProductsQuerySchema = catalogPaginationQuerySchema.extend({
  q: z.string().trim().min(1).max(120).optional(),
  categorySlug: z.string().trim().min(1).max(140).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  inStock: booleanQuerySchema.optional(),
});

export const productImageInputSchema = z.object({
  imageUrl: z.string().trim().min(1).max(2048),
  altText: z.string().trim().max(200).optional(),
  displayOrder: z.number().int().min(0).default(0),
});

export const createProductRequestSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(180),
  description: optionalTextSchema,
  sku: z.string().trim().min(1).max(80),
  price: z.number().nonnegative(),
  stockQuantity: z.number().int().min(0).default(0),
  categoryIds: z.array(z.uuid()).default([]),
  images: z.array(productImageInputSchema).default([]),
});

export const updateProductRequestSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  slug: z.string().trim().min(2).max(180).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  sku: z.string().trim().min(1).max(80).optional(),
  price: z.number().nonnegative().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  categoryIds: z.array(z.uuid()).optional(),
  images: z.array(productImageInputSchema).optional(),
});

export const updateProductInventoryRequestSchema = z.object({
  stockQuantity: z.number().int().min(0),
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
