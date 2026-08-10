import { listManagementRoles } from "@/features/management/roles/api/roles-api";
import { RolesPanel } from "@/features/management/roles/components/roles-panel";
import { PageHeader } from "@/features/management/shared/components/admin-ui";
import { ManagementCreateLink } from "@/features/management/shared/components/management-page-actions";
import { PaginationControls } from "@/shared/ui/pagination-controls";
import { SearchFilter } from "@/features/management/shared/components/search-filter";
import {
  getManagementPage,
  getManagementQuery,
  type ManagementSearchParams,
} from "@/features/management/shared/lib/management-search-params";
import { requireManagementRouteAccess } from "@/features/management/shared/lib/require-management-access";

const ROLES_PAGE_SIZE = 30;

export default async function RolesPage({
  searchParams,
}: {
  searchParams: ManagementSearchParams;
}) {
  const params = await searchParams;
  const query = getManagementQuery(params.q);

  const currentPermissions =
    await requireManagementRouteAccess("/dashboard/roles");
  const roles = await listManagementRoles(
      {
        page: getManagementPage(params.page),
        limit: ROLES_PAGE_SIZE,
      },
      query,
    );
  const canDeleteRoles = currentPermissions.includes("roles.delete");
  const canCreateRoles = currentPermissions.includes("roles.create");
  const canUpdateRoles =
    currentPermissions.includes("roles.update") &&
    currentPermissions.includes("roles.permissions.update");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Roles"
        description="Review system roles and custom roles used by staff accounts."
        action={
          canCreateRoles ? (
            <ManagementCreateLink
              href="/dashboard/roles/new"
              label="Add role"
            />
          ) : undefined
        }
      />
      <SearchFilter
        action="/dashboard/roles"
        defaultValue={query}
        placeholder="Search roles"
      />
      <RolesPanel
        roles={roles.data}
        totalRoles={roles.pagination.totalItems}
        query={query}
        canUpdateRoles={canUpdateRoles}
        canDeleteRoles={canDeleteRoles}
      />
      <PaginationControls pagination={roles.pagination} />
    </div>
  );
}
