import { z } from "zod";

export const addCartItemRequestSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().positive(),
});

export const updateCartItemRequestSchema = z.object({
  quantity: z.number().int().min(0),
});

export type AddCartItemRequest = z.infer<typeof addCartItemRequestSchema>;
export type UpdateCartItemRequest = z.infer<
  typeof updateCartItemRequestSchema
>;
