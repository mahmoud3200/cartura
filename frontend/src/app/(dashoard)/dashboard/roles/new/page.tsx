import {
  listCurrentManagementPermissionNames,
  listManagementPermissions,
} from "@/features/management/roles/api/roles-api";
import { RoleForm } from "@/features/management/roles/components/role-form/role-form";
import { PageHeader } from "@/features/management/shared/components/admin-ui";
import {
  ManagementBackLink,
  ManagementPermissionMessage,
} from "@/features/management/shared/components/management-page-actions";

export default async function NewRolePage() {
  const currentPermissions = await listCurrentManagementPermissionNames();

  if (!currentPermissions.includes("roles.create")) {
    return <ManagementPermissionMessage permission="roles.create" />;
  }

  const permissions = await listManagementPermissions();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Add role"
        description="Create a custom management role and choose the permissions it should grant."
        action={
          <ManagementBackLink href="/dashboard/roles" label="Back to roles" />
        }
      />
      <RoleForm permissions={permissions} />
    </div>
  );
}
