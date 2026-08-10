import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { unwrapManagementAction } from "@/features/management/shared/lib/action-result";
import { createRoleAction } from "../actions/create-role.action";
import { deleteRoleAction } from "../actions/delete-role.action";
import { updateRoleAction } from "../actions/update-role.action";

export function useCreateManagementRole({
  onSuccess,
}: {
  onSuccess?: () => void;
} = {}) {
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: Parameters<typeof createRoleAction>[0]) =>
      unwrapManagementAction(await createRoleAction(input)),
    onSuccess: async () => {
      onSuccess?.();
      toast.success("Role created", {
        description: "The custom role is ready to assign.",
      });
      router.push("/dashboard/roles");
      router.refresh();
    },
    onError: (error) => showRoleMutationError("creation", error),
  });
}

export function useUpdateManagementRole() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: Parameters<typeof updateRoleAction>[0]) =>
      unwrapManagementAction(await updateRoleAction(input)),
    onSuccess: async () => {
      toast.success("Role updated", {
        description: "The role changes were saved.",
      });
      router.push("/dashboard/roles");
      router.refresh();
    },
    onError: (error) => showRoleMutationError("update", error),
  });
}

export function useDeleteManagementRole() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (roleId: string) =>
      unwrapManagementAction(await deleteRoleAction(roleId)),
    onSuccess: async () => {
      toast.success("Role deleted", {
        description: "The custom role was removed.",
      });
      router.refresh();
    },
    onError: (error) => showRoleMutationError("deletion", error),
  });
}

function showRoleMutationError(action: string, error: unknown) {
  toast.error(`Role ${action} failed`, {
    description:
      error instanceof Error
        ? error.message
        : `The role ${action} could not be completed. Try again.`,
  });
}
