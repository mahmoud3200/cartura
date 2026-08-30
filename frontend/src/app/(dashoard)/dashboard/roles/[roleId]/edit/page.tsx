import { PERMISSIONS } from "@cartura/contracts/authorization";

import {
  getManagementRole,
  listManagementPermissions,
} from "@/features/management/roles/api/roles-api";
import { listCurrentManagementPermissionNames } from "@/features/management/shared/api/management-permissions-api";
import { RoleForm } from "@/features/management/roles/components/role-form/role-form";
import { SystemRoleNotice } from "@/features/management/roles/ui/system-role-notice";
import { PageHeader } from "@/features/management/shared/components/admin-ui";
import {
  ManagementBackLink,
  ManagementPermissionMessage,
} from "@/features/management/shared/components/management-page-actions";

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ roleId: string }>;
}) {
  const { roleId } = await params;

  const currentPermissions = await listCurrentManagementPermissionNames();
  const canUpdateRole =
    currentPermissions.includes(PERMISSIONS.ROLES_UPDATE) &&
    currentPermissions.includes(PERMISSIONS.ROLES_UPDATE_PERMISSIONS);

  if (!canUpdateRole) {
    return (
      <ManagementPermissionMessage permission="roles.update and roles.permissions.update" />
    );
  }

  const [role, permissions] = await Promise.all([
    getManagementRole(roleId),
    listManagementPermissions(),
  ]);

  if (role.isSystemRole) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Edit role"
          description="System roles are managed by server bootstrap and cannot be edited from the dashboard."
          action={<BackToRolesLink />}
        />
        <SystemRoleNotice name={role.name} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Edit role"
        description="Update a custom management role and choose the permissions it should grant."
        action={<BackToRolesLink />}
      />
      <RoleForm
        key={role.id}
        mode="edit"
        roleId={role.id}
        permissions={permissions}
        defaultValues={{
          name: role.name,
          description: role.description,
          permissionIds: role.rolePermissions.map((item) => item.permission.id),
        }}
      />
    </div>
  );
}

function BackToRolesLink() {
  return <ManagementBackLink href="/dashboard/roles" label="Back to roles" />;
}
