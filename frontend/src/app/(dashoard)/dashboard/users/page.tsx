import { PageHeader } from "@/features/management/shared/components/admin-ui";
import { PaginationControls } from "@/shared/ui/pagination-controls";
import { ManagementFilters } from "@/features/management/shared/components/management-filters";
import {
  getManagementPage,
  getManagementFilter,
  getManagementQuery,
  type ManagementSearchParams,
} from "@/features/management/shared/lib/management-search-params";
import {
  getManagementUser,
  listManagementUserRoleOptions,
  listManagementUsers,
} from "@/features/management/users/api/users-api";
import { UsersTable } from "@/features/management/users/components/users-table";
import { requireManagementRouteAccess } from "@/features/management/shared/lib/require-management-access";
import { getCurrentAuthUser } from "@/features/auth/api/auth-api";

const USERS_PAGE_SIZE = 30;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: ManagementSearchParams;
}) {
  const params = await searchParams;
  const query = getManagementQuery(params.q);
  const accountStatus = userAccountStatusSchema
    .optional()
    .catch(undefined)
    .parse(getManagementFilter(params.accountStatus));
  const permissionNames =
    await requireManagementRouteAccess("/dashboard/users");

  const canUpdateRole = permissionNames.includes("users.role.update");
  const authUser = await getCurrentAuthUser();
  const [users, roleOptions, actingUser] = await Promise.all([
    listManagementUsers({
      page: getManagementPage(params.page),
      limit: USERS_PAGE_SIZE,
      q: query,
      accountStatus,
    }),
    canUpdateRole ? listManagementUserRoleOptions() : Promise.resolve([]),
    authUser && canUpdateRole
      ? getManagementUser(authUser.id)
      : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users"
        description="Inspect customer and staff accounts, assigned role, verification state, and account status."
      />
      <ManagementFilters
        action="/dashboard/users"
        query={query}
        queryPlaceholder="Search users by name or email"
        selects={[
          {
            name: "accountStatus",
            label: "account statuses",
            value: accountStatus,
            options: ["active", "suspended", "disabled"].map((value) => ({
              label: value,
              value,
            })),
          },
        ]}
      />
      <UsersTable
        users={users.data}
        canUpdateStatus={permissionNames.includes("users.status.update")}
        canUpdateRole={canUpdateRole}
        actingUserId={actingUser?.id ?? ""}
        actingRoleName={actingUser?.role.name ?? ""}
        roleOptions={roleOptions}
        emptyLabel={
          query ? "No users match this search." : "No users are available yet."
        }
      />
      <PaginationControls pagination={users.pagination} />
    </div>
  );
}
import { userAccountStatusSchema } from "@cartura/contracts/users";
