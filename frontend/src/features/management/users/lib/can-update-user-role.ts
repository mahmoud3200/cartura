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

  return input.actingRoleName === "super_admin" ||
    input.targetRoleName !== "admin";
}
