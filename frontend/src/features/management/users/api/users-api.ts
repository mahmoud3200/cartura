import "server-only";

import {
  userRoleOptionSchema,
  type UpdateUserRoleRequest,
} from "@cartura/contracts/authorization";
import {
  userSchema,
  type ListUsersQuery,
  type UpdateUserStatusRequest,
} from "@cartura/contracts/users";

import {
  fetchManagementData,
  fetchManagementPaginated,
  type ManagementPaginationInput,
} from "@/features/management/shared/api/management-api";
import { serverApiFetch } from "@/shared/api/server-api";
export async function listManagementUsers(
  input: ManagementPaginationInput &
    Pick<ListUsersQuery, "q" | "accountStatus" | "emailVerified">,
) {
  return fetchManagementPaginated(
    "/api/v1/management/users",
    userSchema,
    input,
    {
      q: input.q,
      accountStatus: input.accountStatus,
      emailVerified:
        input.emailVerified === undefined
          ? undefined
          : String(input.emailVerified),
    },
  );
}

export function getManagementUser(userId: string) {
  return fetchManagementData(
    `/api/v1/management/users/${encodeURIComponent(userId)}`,
    userSchema,
  );
}

export function listManagementUserRoleOptions() {
  return fetchManagementData(
    "/api/v1/management/authorization/users/role-options",
    userRoleOptionSchema.array(),
  );
}

export function updateManagementUserStatus(
  userId: string,
  input: UpdateUserStatusRequest,
) {
  return fetchManagementData(
    `/api/v1/management/users/${encodeURIComponent(userId)}/status`,
    userSchema,
    { method: "PATCH", json: input },
  );
}

export async function updateManagementUserRole(
  userId: string,
  input: UpdateUserRoleRequest,
) {
  await serverApiFetch<void>(
    `/api/v1/management/authorization/users/${encodeURIComponent(userId)}/role`,
    {
      method: "PUT",
      json: input,
      forwardCookies: true,
    },
  );
}
