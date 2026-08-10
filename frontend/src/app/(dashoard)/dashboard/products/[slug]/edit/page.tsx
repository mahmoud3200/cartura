import { getManagementProductBySlug } from "@/features/management/products/api/products-api";
import { ProductForm } from "@/features/management/products/components/product-form/product-form";
import { listCurrentManagementPermissionNames } from "@/features/management/roles/api/roles-api";
import { PageHeader } from "@/features/management/shared/components/admin-ui";
import {
  ManagementBackLink,
  ManagementPermissionMessage,
} from "@/features/management/shared/components/management-page-actions";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const currentPermissions = await listCurrentManagementPermissionNames();

  if (!currentPermissions.includes("products.update")) {
    return <ManagementPermissionMessage permission="products.update" />;
  }

  const product = await getManagementProductBySlug(slug);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Edit product"
        description="Update product details, stock, status, and category assignments."
        action={
          <ManagementBackLink
            href="/dashboard/products"
            label="Back to products"
          />
        }
      />
      <ProductForm key={product.id} mode="edit" product={product} />
    </div>
  );
}
