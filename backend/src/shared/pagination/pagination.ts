import type { PaginationMetadata } from "@cartura/contracts/common";

import type { PaginationQuery } from "./pagination.schema.js";

export type PaginatedResult<TItem> = {
  items: TItem[];
  pagination: PaginationMetadata;
};

export function getPaginationParams(query: PaginationQuery) {
  return {
    skip: (query.page - 1) * query.limit,
    take: query.limit,
  };
}

export function createPaginationMeta(
  query: PaginationQuery,
  totalItems: number,
): PaginationMetadata {
  const totalPages = Math.ceil(totalItems / query.limit);

  return {
    page: query.page,
    limit: query.limit,
    totalItems,
    totalPages,
    hasNextPage: query.page < totalPages,
    hasPreviousPage: query.page > 1,
  };
}

export function createPaginatedResult<TItem>(
  items: TItem[],
  totalItems: number,
  query: PaginationQuery,
): PaginatedResult<TItem> {
  return {
    items,
    pagination: createPaginationMeta(query, totalItems),
  };
}

export function mapPaginatedResult<TInput, TOutput>(
  result: PaginatedResult<TInput>,
  mapper: (item: TInput) => TOutput,
) {
  return {
    data: result.items.map(mapper),
    pagination: result.pagination,
  };
}
