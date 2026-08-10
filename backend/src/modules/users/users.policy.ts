import { PERMISSIONS } from "../authorization/authorization.constants.js";

export const USER_ROUTE_PERMISSIONS = {
  read: PERMISSIONS.USERS_READ,
  updateStatus: PERMISSIONS.USERS_UPDATE_STATUS,
} as const;
