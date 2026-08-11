import "server-only";

import { redirect } from "next/navigation";

import { listCurrentManagementPermissionNames } from "@/features/management/shared/api/management-permissions-api";
import {
  canAccessManagementRoute,
  getManagementLandingPath,
} from "./management-access";

export async function requireManagementRouteAccess(href: string) {
  const permissionNames = await listCurrentManagementPermissionNames();

  if (!canAccessManagementRoute(href, permissionNames)) {
    redirect(getManagementLandingPath(permissionNames) ?? "/");
  }

  return permissionNames;
}
