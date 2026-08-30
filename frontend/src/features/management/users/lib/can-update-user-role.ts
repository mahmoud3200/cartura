export function canUpdateUserRole(input: {
  hasPermission: boolean;
  actingUserId: string;
  actingRoleName: string;
  targetUserId: string;
  targetRoleName: string;
}) {
  if (!input.hasPermission) {
    return false;
  }

  if (input.actingUserId === input.targetUserId) {
    return false;
  }

  return input.actingRoleName === SYSTEM_ROLES.SUPER_ADMIN ||
    input.targetRoleName !== SYSTEM_ROLES.ADMIN;
}
import { SYSTEM_ROLES } from "@cartura/contracts/authorization";
