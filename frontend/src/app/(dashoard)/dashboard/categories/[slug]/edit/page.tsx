import { getManagementCategoryBySlug } from "@/features/management/categories/api/categories-api";
import { CategoryForm } from "@/features/management/categories/components/category-form/category-form";
import { listCurrentManagementPermissionNames } from "@/features/management/roles/api/roles-api";
import { PageHeader } from "@/features/management/shared/components/admin-ui";
import {
  ManagementBackLink,
  ManagementPermissionMessage,
} from "@/features/management/shared/components/management-page-actions";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const currentPermissions = await listCurrentManagementPermissionNames();

  if (!currentPermissions.includes("categories.update")) {
    return <ManagementPermissionMessage permission="categories.update" />;
  }

  const category = await getManagementCategoryBySlug(slug);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Edit category"
        description="Update category details, parent placement, and visibility."
        action={
          <ManagementBackLink
            href="/dashboard/categories"
            label="Back to categories"
          />
        }
      />
      <CategoryForm key={category.id} mode="edit" category={category} />
    </div>
  );
}
