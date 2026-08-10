import { categoryListResponseSchema } from "@cartura/contracts/catalog";

export async function fetchCategoryOptionsPage(input: {
  page: number;
  limit: number;
  query: string;
}) {
  const searchParams = new URLSearchParams({
    page: String(input.page),
    limit: String(input.limit),
  });

  if (input.query) {
    searchParams.set("q", input.query);
  }

  const response = await fetch(
    `/api/catalog/categories?${searchParams.toString()}`,
  );
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error("Categories could not be loaded.");
  }

  return categoryListResponseSchema.parse(payload);
}
