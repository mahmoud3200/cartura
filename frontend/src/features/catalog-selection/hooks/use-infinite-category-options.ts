"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { fetchCategoryOptionsPage } from "../api/category-options-api";

export function useInfiniteCategoryOptions({
  query = "",
  limit = 20,
}: {
  query?: string;
  limit?: number;
} = {}) {
  return useInfiniteQuery({
    queryKey: ["catalog-selection", "categories", query, limit] as const,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchCategoryOptionsPage({ page: pageParam, limit, query }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.page + 1
        : undefined,
  });
}
