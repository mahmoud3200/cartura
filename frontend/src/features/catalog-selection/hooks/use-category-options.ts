"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  CategoryOptionAncestor,
  CategorySelectOption,
  SelectedCategorySeed,
} from "../types";
import { useInfiniteCategoryOptions } from "./use-infinite-category-options";

const SEARCH_DELAY_MS = 250;

export function useCategoryOptions({
  excludedCategoryIds = [],
  selectedCategories = [],
  initialSearch = "",
}: {
  excludedCategoryIds?: string[];
  selectedCategories?: SelectedCategorySeed[];
  initialSearch?: string;
} = {}) {
  const [search, setSearch] = useState(initialSearch);
  const [query, setQuery] = useState(initialSearch.trim());
  const [loadMoreElement, setLoadMoreElement] =
    useState<HTMLDivElement | null>(null);
  const categories = useInfiniteCategoryOptions({ query });
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = categories;

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setQuery(search.trim()),
      SEARCH_DELAY_MS,
    );

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!loadMoreElement || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "120px" },
    );

    observer.observe(loadMoreElement);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, loadMoreElement]);

  const options = useMemo(() => {
    const loaded = categories.data?.pages.flatMap((page) => page.data) ?? [];
    const all = [...selectedCategories, ...loaded];
    const selectedById = new Map(
      selectedCategories.map((category) => [category.id, category]),
    );
    const directOptions = all.map((category) =>
      toCategoryOption(category, selectedById),
    );
    const ancestorOptions = directOptions.flatMap((category) =>
      category.ancestors.map<CategorySelectOption>((ancestor, index) => ({
        ...ancestor,
        value: ancestor.id,
        label: ancestor.name,
        parentCategoryId: category.ancestors[index - 1]?.id ?? null,
        description: `Parent of ${category.name}`,
        imageUrl: null,
        ancestors: category.ancestors.slice(0, index),
      })),
    );
    const candidates = [...directOptions, ...ancestorOptions];

    return candidates.filter(
      (category, index) =>
        !excludedCategoryIds.includes(category.id) &&
        candidates.findIndex((candidate) => candidate.id === category.id) ===
          index,
    );
  }, [categories.data, excludedCategoryIds, selectedCategories]);

  return {
    search,
    setSearch,
    options,
    setLoadMoreElement,
    isLoading: categories.isLoading,
    isError: categories.isError,
    isFetchingNextPage,
    hasNextPage: Boolean(categories.hasNextPage),
  };
}

function toCategoryOption(
  category: SelectedCategorySeed,
  selectedById: Map<string, SelectedCategorySeed>,
): CategorySelectOption {
  return {
    id: category.id,
    value: category.id,
    label: category.name,
    name: category.name,
    slug: category.slug,
    description:
      "parentCategoryName" in category &&
      typeof category.parentCategoryName === "string"
        ? category.parentCategoryName
        : `/${category.slug}`,
    imageUrl:
      "imageUrl" in category && typeof category.imageUrl === "string"
        ? category.imageUrl
        : null,
    parentCategoryId:
      "parentCategoryId" in category &&
      typeof category.parentCategoryId === "string"
        ? category.parentCategoryId
        : null,
    ancestors:
      "parentCategory" in category && Array.isArray(category.parentCategory)
        ? category.parentCategory
        : resolveSelectedAncestors(category, selectedById),
  };
}

function resolveSelectedAncestors(
  category: SelectedCategorySeed,
  selectedById: Map<string, SelectedCategorySeed>,
) {
  const ancestors: CategoryOptionAncestor[] = [];
  const visited = new Set([category.id]);
  let parentId = category.parentCategoryId ?? null;

  while (parentId && !visited.has(parentId)) {
    const parent = selectedById.get(parentId);

    if (!parent) {
      break;
    }

    ancestors.unshift({ id: parent.id, name: parent.name, slug: parent.slug });
    visited.add(parent.id);
    parentId = parent.parentCategoryId ?? null;
  }

  return ancestors;
}
