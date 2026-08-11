import type { Category } from "@cartura/contracts/catalog";
import { useState, type FormEvent } from "react";
import {
  categoryFormSchema,
  categorySlugFromName,
  toCategoryFieldErrors,
  type CategoryFieldErrors,
  type CategoryFormState,
} from "../lib/category-form";
import {
  useCreateManagementCategory,
  useUpdateManagementCategory,
} from "./use-categories";
import { useCategoryBannerManager } from "./use-category-banner-manager";

export function useCategoryForm({
  category,
  mode = "create",
}: {
  category?: Category;
  mode?: "create" | "edit";
}) {
  const [fieldErrors, setFieldErrors] = useState<CategoryFieldErrors>({});
  const [form, setForm] = useState<CategoryFormState>(() =>
    createInitialCategoryForm(category),
  );
  const banner = useCategoryBannerManager({
    onUploadStart: () =>
      setFieldErrors((current) => ({ ...current, image: undefined })),
  });
  const createCategory = useCreateManagementCategory({
    onSuccess: () => {
      setForm(createInitialCategoryForm());
      setFieldErrors({});
      banner.reset();
    },
  });
  const updateCategory = useUpdateManagementCategory();

  const isPending =
    createCategory.isPending || updateCategory.isPending || banner.isBusy;

  function updateField<TKey extends keyof CategoryFormState>(
    key: TKey,
    value: CategoryFormState[TKey],
  ) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "name" && !current.slug) {
        next.slug = categorySlugFromName(value as string);
      }
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = categoryFormSchema.safeParse({
      name: form.name,
      slug: form.slug,
      description: form.description,
      parentCategoryId: form.parentCategoryId || undefined,
    });

    if (!input.success) {
      setFieldErrors(toCategoryFieldErrors(input.error));
      return;
    }

    const hasExistingImage = Boolean(
      category?.imageAssetId || category?.imageUrl,
    );

    if (!hasExistingImage && !banner.asset) {
      setFieldErrors({ image: "Add a category image before saving." });
      return;
    }

    setFieldErrors({});

    if (mode === "edit" && category) {
      updateCategory.mutate({
        categoryId: category.id,
        category: {
          ...input.data,
          description: input.data.description ?? null,
          parentCategoryId: input.data.parentCategoryId ?? null,
          ...(banner.asset ? { imageAssetId: banner.asset.id } : {}),
        },
      });
      return;
    }

    if (!banner.asset) {
      setFieldErrors({ image: "Add a category image before saving." });
      return;
    }

    createCategory.mutate({
      ...input.data,
      imageAssetId: banner.asset.id,
    });
  }

  return {
    form,
    updateField,
    fieldErrors,
    setFieldErrors,
    banner,
    handleSubmit,
    isPending,
  };
}

function createInitialCategoryForm(
  category?: Category,
): CategoryFormState {
  return {
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
    parentCategoryId: category?.parentCategoryId ?? "",
  };
}
