import { z } from "zod";
import {
  dataResponseSchema,
  paginatedQuerySchema,
  paginatedResponseSchema,
  paginationMetadataSchema,
} from "../common/index.js";

export const MAX_PRODUCT_IMAGES = 10;

const POSTGRES_INTEGER_MAX = 2_147_483_647;
const PRODUCT_PRICE_MAX = 9_999_999_999.99;

const optionalTextSchema = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
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

export const listCategoriesQuerySchema = paginatedQuerySchema({
    q: z.string().trim().min(1).max(120).optional(),
    parentCategoryId: z.uuid().optional(),
});

export const createCategoryRequestSchema = z.object({
  parentCategoryId: z.uuid().optional(),
  name: z.string().trim().min(2).max(120),
  slug: slugSchema(140),
  description: optionalTextSchema(1000),
  imageAssetId: z.uuid(),
}).strict();

export const updateCategoryRequestSchema = z
  .object({
    parentCategoryId: z.uuid().nullable().optional(),
    name: z.string().trim().min(2).max(120).optional(),
    slug: slugSchema(140).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    imageAssetId: z.uuid().optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one category field must be provided",
  });

export const listProductsQuerySchema = paginatedQuerySchema({
      q: z.string().trim().min(1).max(120).optional(),
      minPrice: z.coerce.number().nonnegative().max(PRODUCT_PRICE_MAX).optional(),
      maxPrice: z.coerce.number().nonnegative().max(PRODUCT_PRICE_MAX).optional(),
      inStock: booleanQuerySchema.optional(),
    }).refine(
      ({ minPrice, maxPrice }) =>
        minPrice === undefined ||
        maxPrice === undefined ||
        minPrice <= maxPrice,
      {
        message: "Minimum price cannot exceed maximum price",
        path: ["minPrice"],
      },
    );

export const productImageInputSchema = z.object({
  mediaAssetId: z.uuid(),
  altText: z.string().trim().max(200).optional(),
  displayOrder: z.number().int().min(0).default(0),
}).strict();

const productPriceSchema = z
  .number()
  .nonnegative()
  .max(PRODUCT_PRICE_MAX)
  .multipleOf(0.01);

const productStockSchema = z
  .number()
  .int()
  .min(0)
  .max(POSTGRES_INTEGER_MAX);

export const createProductRequestSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: slugSchema(180),
  description: optionalTextSchema(5000),
  sku: z.string().trim().min(1).max(80),
  price: productPriceSchema,
  stockQuantity: productStockSchema.default(0),
  categoryIds: z.array(z.uuid()).default([]),
  images: z
    .array(productImageInputSchema)
    .min(1)
    .max(MAX_PRODUCT_IMAGES),
}).strict();

export const updateProductRequestSchema = z
  .object({
    name: z.string().trim().min(2).max(160).optional(),
    slug: slugSchema(180).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    sku: z.string().trim().min(1).max(80).optional(),
    price: productPriceSchema.optional(),
    categoryIds: z.array(z.uuid()).optional(),
    images: z
      .array(productImageInputSchema)
      .min(1)
      .max(MAX_PRODUCT_IMAGES)
      .optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one product field must be provided",
  });

export const updateProductInventoryRequestSchema = z.object({
  stockQuantity: productStockSchema,
}).strict();

export const categoryIdParamsSchema = z.object({
  categoryId: z.uuid(),
}).strict();

export const categorySlugParamsSchema = z.object({
  slug: slugSchema(140),
}).strict();

export const categoryProductsParamsSchema = z.object({
  categorySlug: slugSchema(140),
}).strict();

export const productIdParamsSchema = z.object({
  productId: z.uuid(),
}).strict();

export const productSlugParamsSchema = z.object({
  slug: slugSchema(180),
}).strict();

export const paginationResponseSchema = paginationMetadataSchema;

const nullableStringSchema = z.string().nullable();

export const categoryChildSchema = z.object({
  id: z.uuid(),
  parentCategoryId: z.uuid().nullable(),
  name: z.string(),
  slug: z.string(),
  description: nullableStringSchema,
  imageUrl: z.url(),
  imageAssetId: z.uuid(),
  isDeleted: z.literal(false),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const parentCategorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
});

export const categorySchema = categoryChildSchema.extend({
  parentCategoryName: nullableStringSchema,
  parentCategory: z.array(parentCategorySchema).nullable(),
  children: z.array(categoryChildSchema),
});

export const productCategorySchema = z.object({
  id: z.uuid(),
  parentCategoryId: z.uuid().nullable(),
  name: z.string(),
  slug: z.string(),
  description: nullableStringSchema,
  imageUrl: z.url(),
  isDeleted: z.literal(false),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const productImageSchema = z.object({
  id: z.uuid(),
  mediaAssetId: z.uuid().nullable(),
  imageUrl: z.url(),
  altText: nullableStringSchema,
  displayOrder: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const productSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  description: nullableStringSchema,
  sku: z.string(),
  price: productPriceSchema,
  stockQuantity: productStockSchema,
  isDeleted: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  categories: z.array(productCategorySchema),
  images: z.array(productImageSchema),
});

export const categoryListResponseSchema = paginatedResponseSchema(categorySchema);

export const categoryResponseSchema = dataResponseSchema(categorySchema);

export const productListResponseSchema = paginatedResponseSchema(productSchema);

export const productResponseSchema = dataResponseSchema(productSchema);

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
export type CategoryIdParams = z.infer<typeof categoryIdParamsSchema>;
export type CategorySlugParams = z.infer<typeof categorySlugParamsSchema>;
export type CategoryProductsParams = z.infer<
  typeof categoryProductsParamsSchema
>;
export type ProductIdParams = z.infer<typeof productIdParamsSchema>;
export type ProductSlugParams = z.infer<typeof productSlugParamsSchema>;
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
