import "server-only";

import { permissionNameListSchema } from "@cartura/contracts/authorization";
import { cache } from "react";

import { fetchManagementData } from "./management-api";

export const listCurrentManagementPermissionNames = cache(
  async function listCurrentManagementPermissionNames() {
    return fetchManagementData(
      "/api/v1/management/authorization/me/permissions",
      permissionNameListSchema,
    );
  },
);
