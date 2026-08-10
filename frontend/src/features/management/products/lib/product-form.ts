import { createProductRequestSchema } from "@cartura/contracts/catalog";
import { z } from "zod";

export const MAX_PRODUCT_IMAGES = 10;

export type ProductFormState = {
  name: string;
  slug: string;
  description: string;
  sku: string;
  price: number | null;
  stockQuantity: number | null;
};

export type ProductFieldErrors = Partial<
  Record<keyof ProductFormState | "categoryIds" | "images", string>
>;

export const productFormSchema = createProductRequestSchema.omit({
  images: true,
});

export function toProductFieldErrors(error: z.ZodError): ProductFieldErrors {
  const flattened = z.flattenError(error).fieldErrors as Record<
    string,
    string[] | undefined
  >;
  return Object.fromEntries(
    Object.entries(flattened).map(([key, value]) => [key, value?.[0]]),
  ) as ProductFieldErrors;
}

export function productSlugFromName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
