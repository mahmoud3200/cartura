import { useState, type FormEvent } from "react";

import type { ManagementProduct } from "../api/products-api";
import {
  productFormSchema,
  productSlugFromName,
  toProductFieldErrors,
  type ProductFieldErrors,
  type ProductFormState,
} from "../lib/product-form";
import { useProductImageManager } from "./use-product-image-manager";
import {
  useCreateManagementProduct,
  useUpdateManagementProduct,
} from "./use-products";
import { useProductCategorySelection } from "./use-product-category-selection";

export function useProductForm({
  mode = "create",
  product,
}: {
  mode?: "create" | "edit";
  product?: ManagementProduct;
}) {
  const [fieldErrors, setFieldErrors] = useState<ProductFieldErrors>({});
  const [form, setForm] = useState<ProductFormState>(() =>
    createInitialProductForm(product),
  );
  const images = useProductImageManager({
    product,
    productName: form.name,
    onUploadStart: () =>
      setFieldErrors((current) => ({ ...current, images: undefined })),
  });
  const categories = useProductCategorySelection(product?.categories);
  const createProduct = useCreateManagementProduct({
    onSuccess: () => {
      setForm(createInitialProductForm());
      setFieldErrors({});
      images.reset();
      categories.reset();
    },
  });
  const updateProduct = useUpdateManagementProduct();

  const isPending =
    createProduct.isPending ||
    updateProduct.isPending ||
    images.isBusy ||
    images.isRemoving;

  function updateField<TKey extends keyof ProductFormState>(
    key: TKey,
    value: ProductFormState[TKey],
  ) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "name" && !current.slug) {
        next.slug = productSlugFromName(value as string);
      }
      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = productFormSchema.safeParse({
      name: form.name,
      slug: form.slug,
      description: form.description,
      sku: form.sku,
      price: form.price,
      stockQuantity: form.stockQuantity,
      categoryIds: Array.from(categories.directIds),
    });

    if (!input.success) {
      setFieldErrors(toProductFieldErrors(input.error));
      return;
    }
    if (images.imageCount < 1) {
      setFieldErrors({ images: "Add at least one product image." });
      return;
    }

    setFieldErrors({});
    const payload = {
      ...input.data,
      description: input.data.description ?? null,
      images: images.imageInputs,
    };

    if (mode === "edit" && product) {
      updateProduct.mutate({ productId: product.id, product: payload });
      return;
    }

    createProduct.mutate({
      ...input.data,
      images: images.imageInputs,
    });
  }

  return {
    form,
    fieldErrors,
    updateField,
    categories,
    images,
    handleSubmit,
    isPending,
  };
}

function createInitialProductForm(
  product?: ManagementProduct,
): ProductFormState {
  return {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    sku: product?.sku ?? "",
    price: product?.price ?? null,
    stockQuantity: product?.stockQuantity ?? 0,
  };
}
