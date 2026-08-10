import { z } from "zod";

import { dataResponseSchema } from "../common/index.js";

export const addCartItemRequestSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().positive(),
});

export const updateCartItemRequestSchema = z.object({
  quantity: z.number().int().min(0),
});

export const cartProductImageSchema = z.object({
  id: z.string(),
  imageUrl: z.url(),
  altText: z.string().nullable(),
});

export const cartProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  sku: z.string(),
  stockQuantity: z.number().int().nonnegative(),
  isDeleted: z.boolean(),
  image: cartProductImageSchema.nullable(),
});

export const cartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  lineTotal: z.number().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
  product: cartProductSchema,
});

export const cartSchema = z.object({
  id: z.string(),
  userId: z.string(),
  subtotal: z.number().nonnegative(),
  itemCount: z.number().int().nonnegative(),
  uniqueItemCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(cartItemSchema),
});

export const cartDataResponseSchema = dataResponseSchema(cartSchema);

export type AddCartItemRequest = z.infer<typeof addCartItemRequestSchema>;
export type UpdateCartItemRequest = z.infer<
  typeof updateCartItemRequestSchema
>;
export type CartProductImage = z.infer<typeof cartProductImageSchema>;
export type CartProduct = z.infer<typeof cartProductSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type Cart = z.infer<typeof cartSchema>;
export type CartDataResponse = z.infer<typeof cartDataResponseSchema>;
