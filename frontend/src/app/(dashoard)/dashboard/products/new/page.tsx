import { ProductForm } from "@/features/management/products/components/product-form/product-form";
import { listCurrentManagementPermissionNames } from "@/features/management/shared/api/management-permissions-api";
import { PageHeader } from "@/features/management/shared/components/admin-ui";
import {
  ManagementBackLink,
  ManagementPermissionMessage,
} from "@/features/management/shared/components/management-page-actions";

export default async function NewProductPage() {
  const currentPermissions = await listCurrentManagementPermissionNames();

  if (!currentPermissions.includes("products.create")) {
    return <ManagementPermissionMessage permission="products.create" />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Add product"
        description="Create a catalog product using the backend product validation rules."
        action={
          <ManagementBackLink
            href="/dashboard/products"
            label="Back to products"
          />
        }
      />
      <ProductForm />
    </div>
  );
}
