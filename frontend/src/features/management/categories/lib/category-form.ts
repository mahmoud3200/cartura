import { createCategoryRequestSchema } from "@cartura/contracts/catalog";
import { z } from "zod";

export type CategoryFormState = {
  name: string;
  slug: string;
  description: string;
  parentCategoryId: string;
};

export type CategoryFieldErrors = Partial<
  Record<keyof CategoryFormState | "image", string>
>;

export const categoryFormSchema = createCategoryRequestSchema.omit({
  imageAssetId: true,
});

export function toCategoryFieldErrors(
  error: z.ZodError,
): CategoryFieldErrors {
  const flattened = z.flattenError(error).fieldErrors as Record<
    string,
    string[] | undefined
  >;

  return Object.fromEntries(
    Object.entries(flattened).map(([key, value]) => [key, value?.[0]]),
  ) as CategoryFieldErrors;
}

export function categorySlugFromName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
