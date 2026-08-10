import { SYSTEM_ROLES } from "../authorization/authorization.constants.js";

export function isSuperAdmin(user: {
  assignedRole: { role: { name: string } } | null;
}) {
  return user.assignedRole?.role.name === SYSTEM_ROLES.SUPER_ADMIN;
}

export function isExpiredSuspension(user: {
  accountStatus: string;
  suspendedUntil: Date | null;
}) {
  return (
    user.accountStatus === "suspended" &&
    !!user.suspendedUntil &&
    user.suspendedUntil.getTime() <= Date.now()
  );
}
