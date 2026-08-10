"use client";

import { ManagementFormActions } from "@/features/management/shared/components/management-form-actions";
import { ManagementFormSection } from "@/features/management/shared/components/management-form-section";
import type { ManagementPermission } from "../../api/roles-api";
import { useRoleForm } from "../../hooks/use-role-form";
import { RoleDetailsFields } from "./role-details-fields";
import { RolePermissionSelector } from "./role-permission-selector";

export function RoleForm({
  permissions,
  mode = "create",
  roleId,
  defaultValues,
}: {
  permissions: ManagementPermission[];
  mode?: "create" | "edit";
  roleId?: string;
  defaultValues?: {
    name: string;
    description: string | null;
    permissionIds: string[];
  };
}) {
  const form = useRoleForm({ mode, roleId, defaultValues });

  return (
    <form onSubmit={form.handleSubmit} className="space-y-5">
      <ManagementFormSection
        title="Role details"
        description="Set a clear name and description for this staff role."
      >
        <RoleDetailsFields
          form={form.form}
          errors={form.fieldErrors}
          onChange={form.updateField}
        />
      </ManagementFormSection>

      <ManagementFormSection
        title="Permissions"
        description="Choose the dashboard actions granted by this role."
      >
        <RolePermissionSelector
          permissions={permissions}
          selectedIds={form.form.permissionIds}
          error={form.fieldErrors.permissionIds}
          onToggle={form.togglePermission}
        />
      </ManagementFormSection>

      <ManagementFormActions
        mode={mode}
        resourceLabel="role"
        isPending={form.isPending}
        isUploading={false}
      />
    </form>
  );
}
