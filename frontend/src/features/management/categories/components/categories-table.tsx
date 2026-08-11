"use client";

import type { Category } from "@cartura/contracts/catalog";
import { StatusBadge } from "@/features/management/shared/components/admin-ui";
import { ManagementRowActions } from "@/features/management/shared/components/management-row-actions";
import {
  ManagementTable,
  ManagementTableCell,
} from "@/features/management/shared/components/management-table";
import { formatDateTime } from "@/features/management/shared/lib/admin-utils";
import { useDeleteManagementCategory } from "../hooks/use-categories";

const columns = [
  { label: "Category" },
  { label: "Parent" },
  { label: "Status" },
  { label: "Updated" },
  { label: "Actions", className: "text-right" },
];

export function CategoriesTable({
  categories,
  canUpdateCategories = false,
  canDeleteCategories = false,
}: {
  categories: Category[];
  canUpdateCategories?: boolean;
  canDeleteCategories?: boolean;
}) {
  const deleteCategory = useDeleteManagementCategory();

  return (
    <ManagementTable
      items={categories}
      columns={columns}
      gridTemplateColumns="1.4fr 0.9fr 0.6fr 0.7fr 0.5fr"
      getRowKey={(category) => category.id}
      emptyLabel="No categories are available yet."
      renderCells={(category) => (
        <>
          <ManagementTableCell>
            <p className="truncate font-medium">{category.name}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {category.slug}
            </p>
          </ManagementTableCell>
          <p className="text-muted-foreground">
            {category.parentCategoryName ?? "N/A"}
          </p>
          <StatusBadge status={category.isDeleted ? "disabled" : "active"} />
          <p className="text-xs text-muted-foreground">
            {formatDateTime(category.updatedAt)}
          </p>
          <ManagementRowActions
            editHref={
              canUpdateCategories
                ? `/dashboard/categories/${category.slug}/edit`
                : undefined
            }
            canDelete={canDeleteCategories}
            isDeleting={
              deleteCategory.isPending && deleteCategory.variables === category.id
            }
            resourceLabel={category.name}
            onDelete={() => deleteCategory.mutate(category.id)}
          />
        </>
      )}
    />
  );
}
