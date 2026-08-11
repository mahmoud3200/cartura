import { listManagementProducts } from "@/features/management/products/api/products-api";
import { ProductsTable } from "@/features/management/products/components/products-table";
import { PageHeader } from "@/features/management/shared/components/admin-ui";
import { ManagementFilters } from "@/features/management/shared/components/management-filters";
import { requireManagementRouteAccess } from "@/features/management/shared/lib/require-management-access";
import { ManagementCreateLink } from "@/features/management/shared/components/management-page-actions";
import { PaginationControls } from "@/shared/ui/pagination-controls";
import {
  getManagementPage,
  getManagementFilter,
  getManagementQuery,
  type ManagementSearchParams,
} from "@/features/management/shared/lib/management-search-params";

const PRODUCTS_PAGE_SIZE = 30;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: ManagementSearchParams;
}) {
  const params = await searchParams;
  const query = getManagementQuery(params.q);
  const inStockFilter = getManagementFilter(params.inStock);
  const parsedFilters = listProductsQuerySchema.safeParse({
    page: 1,
    limit: PRODUCTS_PAGE_SIZE,
    inStock: inStockFilter,
  });
  const inStock = parsedFilters.success
    ? parsedFilters.data.inStock
    : undefined;

  const currentPermissions =
    await requireManagementRouteAccess("/dashboard/products");
  const products = await listManagementProducts({
      page: getManagementPage(params.page),
      limit: PRODUCTS_PAGE_SIZE,
      q: query,
      inStock,
    });
  const canCreateProducts = currentPermissions.includes("products.create");
  const canUpdateProducts = currentPermissions.includes("products.update");
  const canDeleteProducts = currentPermissions.includes("products.delete");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products"
        description="Review storefront product records, stock levels, and published state."
        action={
          canCreateProducts ? (
            <ManagementCreateLink
              href="/dashboard/products/new"
              label="Add product"
            />
          ) : undefined
        }
      />
      <ManagementFilters
        action="/dashboard/products"
        query={query}
        queryPlaceholder="Search product name, SKU, or slug"
        selects={[
          {
            name: "inStock",
            label: "stock states",
            value: inStockFilter,
            options: [
              { label: "In stock", value: "true" },
              { label: "Out of stock", value: "false" },
            ],
          },
        ]}
      />
      <ProductsTable
        products={products.data}
        canUpdateProducts={canUpdateProducts}
        canDeleteProducts={canDeleteProducts}
      />
      <PaginationControls pagination={products.pagination} />
    </div>
  );
}
import { listProductsQuerySchema } from "@cartura/contracts/catalog";
