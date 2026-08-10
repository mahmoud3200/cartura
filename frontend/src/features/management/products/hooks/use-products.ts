import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { unwrapManagementAction } from "@/features/management/shared/lib/action-result";
import { createProductAction } from "../actions/create-product.action";
import { deleteProductAction } from "../actions/delete-product.action";
import { updateProductAction } from "../actions/update-product.action";

export function useCreateManagementProduct({
  onSuccess,
}: {
  onSuccess?: () => void;
} = {}) {
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: Parameters<typeof createProductAction>[0]) =>
      unwrapManagementAction(await createProductAction(input)),
    onSuccess: async () => {
      onSuccess?.();
      toast.success("Product created", {
        description: "The product is now available in the catalog.",
      });
      router.push("/dashboard/products");
      router.refresh();
    },
    onError: (error) => {
      toast.error("Product creation failed", {
        description:
          error instanceof Error
            ? error.message
            : "The product could not be created. Try again.",
      });
    },
  });
}

export function useUpdateManagementProduct() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: Parameters<typeof updateProductAction>[0]) =>
      unwrapManagementAction(await updateProductAction(input)),
    onSuccess: async () => {
      toast.success("Product updated", {
        description: "The product changes were saved.",
      });
      router.push("/dashboard/products");
      router.refresh();
    },
    onError: (error) => {
      toast.error("Product update failed", {
        description:
          error instanceof Error
            ? error.message
            : "The product could not be updated. Try again.",
      });
    },
  });
}

export function useDeleteManagementProduct() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (productId: string) =>
      unwrapManagementAction(await deleteProductAction(productId)),
    onSuccess: async () => {
      toast.success("Product deleted", {
        description: "The product was removed from the catalog.",
      });
      router.push("/dashboard/products");
      router.refresh();
    },
    onError: (error) => {
      toast.error("Product deletion failed", {
        description:
          error instanceof Error
            ? error.message
            : "The product could not be deleted. Try again.",
      });
    },
  });
}
