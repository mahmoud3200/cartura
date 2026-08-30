import { z } from "zod";

import { dataResponseSchema } from "../common/index.js";

const postgresIntegerMax = 2_147_483_647;

export const cartItemParamsSchema = z.object({
  productId: z.uuid(),
}).strict();

export const addCartItemRequestSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().positive().max(postgresIntegerMax),
}).strict();

export const updateCartItemRequestSchema = z.object({
  quantity: z.number().int().min(0).max(postgresIntegerMax),
}).strict();

export const cartProductImageSchema = z.object({
  id: z.uuid(),
  imageUrl: z.url(),
  altText: z.string().nullable(),
}).strict();

export const cartProductSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  sku: z.string(),
  stockQuantity: z.number().int().nonnegative(),
  isDeleted: z.boolean(),
  image: cartProductImageSchema.nullable(),
}).strict();

export const cartItemSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  lineTotal: z.number().nonnegative(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  product: cartProductSchema,
}).strict();

export const cartSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  subtotal: z.number().nonnegative(),
  itemCount: z.number().int().nonnegative(),
  uniqueItemCount: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  items: z.array(cartItemSchema),
}).strict();

export const cartDataResponseSchema = dataResponseSchema(cartSchema);

export type CartItemParams = z.infer<typeof cartItemParamsSchema>;
export type AddCartItemRequest = z.infer<typeof addCartItemRequestSchema>;
export type UpdateCartItemRequest = z.infer<
  typeof updateCartItemRequestSchema
>;
export type CartProductImage = z.infer<typeof cartProductImageSchema>;
export type CartProduct = z.infer<typeof cartProductSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type Cart = z.infer<typeof cartSchema>;
export type CartDataResponse = z.infer<typeof cartDataResponseSchema>;
