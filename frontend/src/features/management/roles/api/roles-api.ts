import type {
  CreateRoleRequest,
  Permission,
  Role,
  UpdateRoleRequest,
} from "@cartura/contracts/authorization";
import { cache } from "react";
import {
  permissionNameListSchema,
  permissionSchema,
  roleSchema,
} from "@cartura/contracts/authorization";

import {
  fetchManagementData,
  fetchManagementPaginated,
  type ManagementPaginationInput,
} from "@/features/management/shared/api/management-api";
import { serverApiFetch } from "@/shared/api/server-api";

export type ManagementRole = Role;
export type ManagementPermission = Permission;

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

export const listCurrentManagementPermissionNames = cache(async function listCurrentManagementPermissionNames() {
  return fetchManagementData(
    "/api/v1/management/authorization/me/permissions",
    permissionNameListSchema,
  );
});

export async function createManagementRole(input: CreateRoleRequest) {
  await serverApiFetch<unknown>("/api/v1/management/authorization/roles", {
    method: "POST",
    json: input,
    forwardCookies: true,
  });
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
  await serverApiFetch<unknown>(
    `/api/v1/management/authorization/roles/${input.roleId}`,
    {
    method: "PATCH",
      json: input.role,
      forwardCookies: true,
    },
  );
}

export async function deleteManagementRole(roleId: string) {
  await serverApiFetch<unknown>(
    `/api/v1/management/authorization/roles/${roleId}`,
    {
    method: "DELETE",
      forwardCookies: true,
    },
  );
}
import "server-only";
