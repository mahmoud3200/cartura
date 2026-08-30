"use client";

import { useState, type FormEvent } from "react";

import {
  toRoleFieldErrors,
  validateRoleForm,
  type RoleFieldErrors,
  type RoleFormState,
} from "../lib/role-form";
import {
  useCreateManagementRole,
  useUpdateManagementRole,
} from "./use-roles";

export function useRoleForm({
  mode = "create",
  roleId,
  defaultValues,
}: {
  mode?: "create" | "edit";
  roleId?: string;
  defaultValues?: {
    name: string;
    description: string | null;
    permissionIds: string[];
  };
}) {
  const [fieldErrors, setFieldErrors] = useState<RoleFieldErrors>({});
  const [form, setForm] = useState<RoleFormState>(() =>
    createInitialRoleForm(defaultValues),
  );
  const createRole = useCreateManagementRole({
    onSuccess: () => {
      setForm(createInitialRoleForm());
      setFieldErrors({});
    },
  });
  const updateRole = useUpdateManagementRole();

  function updateField<TKey extends "name" | "description">(
    key: TKey,
    value: RoleFormState[TKey],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  function togglePermission(permissionId: string) {
    setForm((current) => {
      const permissionIds = new Set(current.permissionIds);
      if (permissionIds.has(permissionId)) permissionIds.delete(permissionId);
      else permissionIds.add(permissionId);
      return { ...current, permissionIds };
    });
    setFieldErrors((current) => ({ ...current, permissionIds: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = validateRoleForm(form);

    if (!input.success) {
      setFieldErrors(toRoleFieldErrors(input.error));
      return;
    }

    setFieldErrors({});
    if (mode === "edit") {
      if (!roleId) return;
      updateRole.mutate({
        roleId,
        role: {
          name: input.data.name,
          description: input.data.description ?? null,
        },
        permissions: { permissionIds: input.data.permissionIds },
      });
      return;
    }

    createRole.mutate(input.data);
  }

  return {
    form,
    fieldErrors,
    updateField,
    togglePermission,
    handleSubmit,
    isPending: createRole.isPending || updateRole.isPending,
  };
}

function createInitialRoleForm(
  defaultValues?: {
    name: string;
    description: string | null;
    permissionIds: string[];
  },
): RoleFormState {
  return {
    name: defaultValues?.name ?? "",
    description: defaultValues?.description ?? "",
    permissionIds: new Set(defaultValues?.permissionIds ?? []),
  };
}
