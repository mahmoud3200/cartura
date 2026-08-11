import "server-only";

import type {
  CreateRoleRequest,
  UpdateRoleRequest,
} from "@cartura/contracts/authorization";
import {
  permissionSchema,
  roleSchema,
} from "@cartura/contracts/authorization";

import {
  fetchManagementData,
  fetchManagementPaginated,
  type ManagementPaginationInput,
} from "@/features/management/shared/api/management-api";
import { serverApiFetch } from "@/shared/api/server-api";

export async function listManagementRoles(
  pagination: ManagementPaginationInput | number,
  query?: string,
) {
  return fetchManagementPaginated(
    "/api/v1/management/authorization/roles",
    roleSchema,
    pagination,
    { q: query },
  );
}

export async function listManagementPermissions() {
  return fetchManagementData(
    "/api/v1/management/authorization/permissions",
    permissionSchema.array(),
  );
}

export async function createManagementRole(input: CreateRoleRequest) {
  return fetchManagementData(
    "/api/v1/management/authorization/roles",
    roleSchema,
    {
      method: "POST",
      json: input,
    },
  );
}

export async function getManagementRole(roleId: string) {
  return fetchManagementData(
    `/api/v1/management/authorization/roles/${roleId}`,
    roleSchema,
  );
}

export async function updateManagementRole(input: {
  roleId: string;
  role: UpdateRoleRequest;
}) {
  return fetchManagementData(
    `/api/v1/management/authorization/roles/${input.roleId}`,
    roleSchema,
    {
      method: "PATCH",
      json: input.role,
    },
  );
}

export async function deleteManagementRole(roleId: string) {
  await serverApiFetch<void>(
    `/api/v1/management/authorization/roles/${roleId}`,
    {
      method: "DELETE",
      forwardCookies: true,
    },
  );
}
