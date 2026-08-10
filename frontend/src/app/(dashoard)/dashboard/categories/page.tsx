import { listManagementCategories } from "@/features/management/categories/api/categories-api";
import { CategoriesTable } from "@/features/management/categories/components/categories-table";
import { PageHeader } from "@/features/management/shared/components/admin-ui";
import { ManagementFilters } from "@/features/management/shared/components/management-filters";
import { requireManagementRouteAccess } from "@/features/management/shared/lib/require-management-access";
import { ManagementCreateLink } from "@/features/management/shared/components/management-page-actions";
import { PaginationControls } from "@/shared/ui/pagination-controls";
import {
  getManagementPage,
  getManagementQuery,
  type ManagementSearchParams,
} from "@/features/management/shared/lib/management-search-params";

const CATEGORIES_PAGE_SIZE = 10;

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: ManagementSearchParams;
}) {
  const params = await searchParams;
  const query = getManagementQuery(params.q);

  const currentPermissions =
    await requireManagementRouteAccess("/dashboard/categories");
  const categories = await listManagementCategories({
      page: getManagementPage(params.page),
      limit: CATEGORIES_PAGE_SIZE,
    }, query);
  const canCreateCategories = currentPermissions.includes("categories.create");
  const canUpdateCategories = currentPermissions.includes("categories.update");
  const canDeleteCategories = currentPermissions.includes("categories.delete");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Categories"
        description="Manage storefront categories and their parent relationships."
        action={
          canCreateCategories ? (
            <ManagementCreateLink
              href="/dashboard/categories/new"
              label="Add category"
            />
          ) : undefined
        }
      />
      <ManagementFilters
        action="/dashboard/categories"
        query={query}
        queryPlaceholder="Search category name, slug, or description"
      />
      <CategoriesTable
        categories={categories.data}
        canUpdateCategories={canUpdateCategories}
        canDeleteCategories={canDeleteCategories}
      />
      <PaginationControls pagination={categories.pagination} />
    </div>
  );
}
