import type { User } from "@cartura/contracts/users";

import type { UserWithRelations } from "./users.types.js";

export function mapUser(user: UserWithRelations): User {
  if (!user.assignedRole) {
    throw new Error(`User ${user.id} does not have a required role`);
  }

  return {
    id: user.id,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image,
    twoFactorEnabled: user.twoFactorEnabled,
    accountStatus: user.accountStatus,
    accountStatusReason: user.accountStatusReason,
    suspendedUntil: user.suspendedUntil?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    role: {
      id: user.assignedRole.role.id,
      name: user.assignedRole.role.name,
      description: user.assignedRole.role.description,
      isSystemRole: user.assignedRole.role.isSystemRole,
      assignedAt: user.assignedRole.assignedAt.toISOString(),
    },
  };
}
