"use client";

import type { Product } from "@cartura/contracts/catalog";
import { StatusBadge } from "@/features/management/shared/components/admin-ui";
import { ManagementRowActions } from "@/features/management/shared/components/management-row-actions";
import {
  ManagementTable,
  ManagementTableCell,
} from "@/features/management/shared/components/management-table";
import { formatMoney } from "@/features/management/shared/lib/admin-utils";
import { useDeleteManagementProduct } from "../hooks/use-products";

const columns = [
  { label: "Product" },
  { label: "Categories" },
  { label: "Price" },
  { label: "Status" },
  { label: "Actions", className: "text-right" },
];

export function ProductsTable({
  products,
  canUpdateProducts = false,
  canDeleteProducts = false,
}: {
  products: Product[];
  canUpdateProducts?: boolean;
  canDeleteProducts?: boolean;
}) {
  const deleteProduct = useDeleteManagementProduct();

  return (
    <ManagementTable
      items={products}
      columns={columns}
      gridTemplateColumns="1.4fr 1fr 0.65fr 0.55fr 0.5fr"
      getRowKey={(product) => product.id}
      emptyLabel="No products are available yet."
      renderCells={(product) => (
        <>
          <ManagementTableCell>
            <p className="truncate font-medium">{product.name}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {product.sku}
            </p>
          </ManagementTableCell>
          <p className="truncate text-muted-foreground">
            {product.categories.length
              ? product.categories.map((category) => category.name).join(", ")
              : "Uncategorized"}
          </p>
          <p className="font-mono tabular-nums">
            {formatMoney(product.price, "EGP")}
          </p>
          <StatusBadge status={product.isDeleted ? "disabled" : "active"} />
          <ManagementRowActions
            editHref={
              canUpdateProducts
                ? `/dashboard/products/${product.slug}/edit`
                : undefined
            }
            canDelete={canDeleteProducts}
            isDeleting={
              deleteProduct.isPending && deleteProduct.variables === product.id
            }
            resourceLabel={product.name}
            onDelete={() => deleteProduct.mutate(product.id)}
          />
        </>
      )}
    />
  );
}
