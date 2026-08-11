import { SYSTEM_ROLES } from "./authorization.constants.js";

export type UserRoleUpdateDenial =
  | "self_role_change"
  | "protected_role_change"
  | null;

export function getUserRoleUpdateDenial(input: {
  actingUserId: string;
  actingRoleName: string | null;
  targetUserId: string;
  targetRoleName: string | null;
}): UserRoleUpdateDenial {
  if (input.actingUserId === input.targetUserId) {
    return "self_role_change";
  }

  if (
    input.actingRoleName !== SYSTEM_ROLES.SUPER_ADMIN &&
    input.targetRoleName === SYSTEM_ROLES.ADMIN
  ) {
    return "protected_role_change";
  }

  return null;
}
