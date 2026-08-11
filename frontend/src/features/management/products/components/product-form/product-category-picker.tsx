"use client";

import type { Product } from "@cartura/contracts/catalog";
import { useCategoryOptions } from "@/features/catalog-selection/hooks/use-category-options";
import type { CategoryOption } from "@/features/catalog-selection/types";
import { InfiniteMultiSelect } from "@/shared/ui/infinite-select";

export function ProductCategoryPicker({
  selectedIds,
  inheritedIds,
  selectedCategories = [],
  onToggle,
}: {
  selectedIds: Set<string>;
  inheritedIds: Set<string>;
  selectedCategories?: Product["categories"];
  onToggle: (category: CategoryOption) => void;
}) {
  const browser = useCategoryOptions({ selectedCategories });

  function handleValueChange(nextValues: string[]) {
    const nextIds = new Set(nextValues);
    const changedId =
      browser.options.find(
        (category) =>
          selectedIds.has(category.id) !== nextIds.has(category.id),
      )?.id ?? null;
    const changedCategory = browser.options.find(
      (category) => category.id === changedId,
    );

    if (changedCategory) {
      onToggle(changedCategory);
    }
  }

  return (
    <div className="space-y-3">
      <InfiniteMultiSelect
        value={Array.from(selectedIds)}
        onValueChange={handleValueChange}
        options={browser.options.map((category) => ({
          value: category.id,
          label: category.name,
          disabled: inheritedIds.has(category.id),
        }))}
        search={browser.search}
        onSearchChange={browser.setSearch}
        placeholder="Select product categories"
        searchPlaceholder="Search product categories"
        emptyLabel="No matching categories found."
        errorLabel="Categories could not be loaded."
        isLoading={browser.isLoading}
        isError={browser.isError}
        isLoadingMore={browser.isFetchingNextPage}
        hasNextPage={browser.hasNextPage}
        loadMoreRef={browser.setLoadMoreElement}
        className="h-10"
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {selectedIds.size} directly selected
        {inheritedIds.size > 0
          ? `, plus ${inheritedIds.size} inherited ${inheritedIds.size === 1 ? "category" : "categories"}.`
          : "."}
      </p>
    </div>
  );
}
