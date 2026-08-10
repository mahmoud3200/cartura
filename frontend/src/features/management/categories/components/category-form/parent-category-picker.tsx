"use client";

import { useCategoryOptions } from "@/features/catalog-selection/hooks/use-category-options";
import { InfiniteSelect } from "@/shared/ui/infinite-select";

export function ParentCategoryPicker({
  value,
  onChange,
  excludedCategoryId,
  selectedCategory,
}: {
  value: string;
  onChange: (categoryId: string) => void;
  excludedCategoryId?: string;
  selectedCategory?: { id: string; name: string; slug: string };
}) {
  const {
    search,
    setSearch,
    options,
    setLoadMoreElement,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
  } = useCategoryOptions({
    excludedCategoryIds: excludedCategoryId ? [excludedCategoryId] : [],
    selectedCategories: selectedCategory ? [selectedCategory] : [],
  });

  return (
    <InfiniteSelect
      value={value}
      onValueChange={onChange}
      options={[
        { value: "", label: "No parent" },
        ...options.map((category) => ({
          value: category.id,
          label: category.name,
        })),
      ]}
      search={search}
      onSearchChange={setSearch}
      placeholder="No parent"
      searchPlaceholder="Search parent categories"
      emptyLabel="No matching categories found."
      errorLabel="Categories could not be loaded."
      isLoading={isLoading}
      isError={isError}
      isLoadingMore={isFetchingNextPage}
      hasNextPage={hasNextPage}
      loadMoreRef={setLoadMoreElement}
      className="h-10"
    />
  );
}
