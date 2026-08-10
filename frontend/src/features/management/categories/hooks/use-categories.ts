import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { unwrapManagementAction } from "@/features/management/shared/lib/action-result";
import { createCategoryAction } from "../actions/create-category.action";
import { deleteCategoryAction } from "../actions/delete-category.action";
import { updateCategoryAction } from "../actions/update-category.action";

export function useCreateManagementCategory({
  onSuccess,
}: {
  onSuccess?: () => void;
} = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Parameters<typeof createCategoryAction>[0]) =>
      unwrapManagementAction(await createCategoryAction(input)),
    onSuccess: async () => {
      onSuccess?.();
      toast.success("Category created", {
        description: "The category is now available in the catalog.",
      });
      await queryClient.invalidateQueries({
        queryKey: ["management", "categories"],
      });
      router.push("/dashboard/categories");
      router.refresh();
    },
    onError: (error) => {
      toast.error("Category creation failed", {
        description:
          error instanceof Error
            ? error.message
            : "The category could not be created. Try again.",
      });
    },
  });
}

export function useUpdateManagementCategory() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Parameters<typeof updateCategoryAction>[0]) =>
      unwrapManagementAction(await updateCategoryAction(input)),
    onSuccess: async (category) => {
      toast.success("Category updated", {
        description: "The category changes were saved.",
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["management", "categories"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["management", "categories", "detail", category.slug],
        }),
      ]);
      router.push("/dashboard/categories");
      router.refresh();
    },
    onError: (error) => {
      toast.error("Category update failed", {
        description:
          error instanceof Error
            ? error.message
            : "The category could not be updated. Try again.",
      });
    },
  });
}

export function useDeleteManagementCategory() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) =>
      unwrapManagementAction(await deleteCategoryAction(categoryId)),
    onSuccess: async () => {
      toast.success("Category deleted", {
        description: "The category was removed from the catalog.",
      });
      await queryClient.invalidateQueries({
        queryKey: ["management", "categories"],
      });
      router.push("/dashboard/categories");
      router.refresh();
    },
    onError: (error) => {
      toast.error("Category deletion failed", {
        description:
          error instanceof Error
            ? error.message
            : "The category could not be deleted. Try again.",
      });
    },
  });
}
