import type { ListProductsQuery } from "@cartura/contracts/catalog";

export type ProductFilterValues = {
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

export function parseProductFilters(
  searchParams: SearchParams,
): ProductFilterValues {
  const minPrice = parseNonNegativeNumber(first(searchParams.minPrice));
  const maxPrice = parseNonNegativeNumber(first(searchParams.maxPrice));

  return {
    q: parseText(first(searchParams.q), 120),
    minPrice,
    maxPrice:
      maxPrice !== undefined &&
      (minPrice === undefined || maxPrice >= minPrice)
        ? maxPrice
        : undefined,
    inStock: parseBoolean(first(searchParams.inStock)),
    page: parsePositiveInteger(first(searchParams.page)) ?? 1,
  };
}

export function toProductListInput(
  filters: ProductFilterValues,
  options: { limit: number },
): Partial<ListProductsQuery> {
  return {
    page: filters.page,
    limit: options.limit,
    q: filters.q,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    inStock: filters.inStock,
  };
}

export function hasProductFilters(filters: ProductFilterValues) {
  return Boolean(
    filters.q ||
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined ||
      filters.inStock !== undefined,
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseText(value: string | undefined, maxLength: number) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function parseNonNegativeNumber(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function parsePositiveInteger(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseBoolean(value: string | undefined) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}
