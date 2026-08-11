"use client";

import type { Product } from "@cartura/contracts/catalog";
import { ManagementFieldError } from "@/features/management/shared/components/management-form-field";
import { ManagementFormSection } from "@/features/management/shared/components/management-form-section";
import { useProductForm } from "../../hooks/use-product-form";
import { MAX_PRODUCT_IMAGES } from "../../lib/product-form";
import { ProductDetailsFields } from "./product-details-fields";
import { ManagementFormActions } from "@/features/management/shared/components/management-form-actions";
import { ProductImagesField } from "./product-images-field";
import { ProductCategoryPicker } from "./product-category-picker";
import { ImageEditorDialog } from "@/features/management/shared/components/image-editor-dialog";

export function ProductForm({
  mode = "create",
  product,
}: {
  mode?: "create" | "edit";
  product?: Product;
}) {
  const form = useProductForm({ mode, product });

  return (
    <form onSubmit={form.handleSubmit} className="space-y-5">
      <ManagementFormSection
        title="Product details"
        description="Set the product identity, price, inventory, and storefront description."
      >
        <ProductDetailsFields
          form={form.form}
          errors={form.fieldErrors}
          onChange={form.updateField}
        />
      </ManagementFormSection>

      <ManagementFormSection
        title="Images"
        description={`Upload up to ${MAX_PRODUCT_IMAGES} square product images.`}
      >
        <ProductImagesField
          existingImages={form.images.existingImages}
          pendingImages={form.images.pendingImages}
          error={form.fieldErrors.images}
          isUploading={form.images.isUploading}
          isRemoving={form.images.isRemoving}
          onSelect={(event) => void form.images.selectFiles(event)}
          onDropFiles={form.images.addFiles}
          onRemoveExisting={form.images.removeExistingImage}
          onRemovePending={(assetId) =>
            void form.images.removePendingImage(assetId)
          }
        />
      </ManagementFormSection>

      <ManagementFormSection
        title="Categories"
        description="Search and select every active category this product belongs to."
      >
        <ProductCategoryPicker
          selectedIds={form.categories.directIds}
          inheritedIds={form.categories.inheritedIds}
          selectedCategories={product?.categories}
          onToggle={form.categories.toggle}
        />
        <ManagementFieldError message={form.fieldErrors.categoryIds} />
      </ManagementFormSection>

      <ManagementFormActions
        mode={mode}
        resourceLabel="product"
        isPending={form.isPending}
        isUploading={form.images.isBusy}
      />
      <ImageEditorDialog editor={form.images.editor} />
    </form>
  );
}
