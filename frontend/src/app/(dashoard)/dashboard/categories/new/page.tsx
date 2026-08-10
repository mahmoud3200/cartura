import { CategoryForm } from "@/features/management/categories/components/category-form/category-form";
import { listCurrentManagementPermissionNames } from "@/features/management/roles/api/roles-api";
import { PageHeader } from "@/features/management/shared/components/admin-ui";
import {
  ManagementBackLink,
  ManagementPermissionMessage,
} from "@/features/management/shared/components/management-page-actions";

export default async function NewCategoryPage() {
  const currentPermissions = await listCurrentManagementPermissionNames();

  if (!currentPermissions.includes("categories.create")) {
    return <ManagementPermissionMessage permission="categories.create" />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Add category"
        description="Create a storefront category and optionally place it under a parent category."
        action={
          <ManagementBackLink
            href="/dashboard/categories"
            label="Back to categories"
          />
        }
      />
      <CategoryForm />
    </div>
  );
}
