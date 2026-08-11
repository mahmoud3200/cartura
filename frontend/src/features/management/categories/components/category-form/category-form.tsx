"use client";

import type { Category } from "@cartura/contracts/catalog";
import { useCategoryForm } from "../../hooks/use-category-form";
import { CategoryDetailsFields } from "./category-details-fields";
import { ManagementFormActions } from "@/features/management/shared/components/management-form-actions";
import { ManagementFormSection } from "@/features/management/shared/components/management-form-section";
import { CategoryImageField } from "./category-image-field";
import { ManagementFieldError } from "@/features/management/shared/components/management-form-field";
import { ParentCategoryPicker } from "./parent-category-picker";
import { ImageEditorDialog } from "@/features/management/shared/components/image-editor-dialog";

export function CategoryForm({
  mode = "create",
  category,
}: {
  mode?: "create" | "edit";
  category?: Category;
}) {
  const form = useCategoryForm({ category, mode });

  return (
    <form onSubmit={form.handleSubmit} className="space-y-5">
      <ManagementFormSection
        title="Category details"
        description="Set the category name, unique slug, and storefront description."
      >
        <CategoryDetailsFields
          form={form.form}
          errors={form.fieldErrors}
          onChange={form.updateField}
        />
      </ManagementFormSection>

      <ManagementFormSection
        title="Parent category"
        description="Search the catalog and choose where this category belongs."
      >
        <ParentCategoryPicker
          value={form.form.parentCategoryId}
          onChange={(value) => form.updateField("parentCategoryId", value)}
          excludedCategoryId={category?.id}
          selectedCategory={category?.parentCategory?.at(-1)}
        />
        <ManagementFieldError message={form.fieldErrors.parentCategoryId} />
      </ManagementFormSection>

      <ManagementFormSection
        title="Category image"
        description="Upload one wide banner image. Recommended size: 1440x480."
      >
        <CategoryImageField
          categoryName={form.form.name}
          existingImageUrl={category?.imageUrl}
          previewUrl={form.banner.previewUrl}
          hasUploadedImage={Boolean(form.banner.asset)}
          error={form.fieldErrors.image}
          isUploading={form.banner.isUploading}
          isRemoving={form.banner.isRemoving}
          onSelect={(event) => void form.banner.selectFile(event)}
          onDropFiles={form.banner.addFiles}
          onRemove={() => void form.banner.removeAsset()}
        />
      </ManagementFormSection>

      <ManagementFormActions
        mode={mode}
        resourceLabel="category"
        isPending={form.isPending}
        isUploading={form.banner.isBusy}
      />
      <ImageEditorDialog editor={form.banner.editor} />
    </form>
  );
}
