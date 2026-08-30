import {
  userAccountStatusSchema,
  type User,
} from "@cartura/contracts/users";

import type { UserWithRelations } from "./users.repository.js";

export function mapUser(user: UserWithRelations): User {
  return {
    id: user.id,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image,
    twoFactorEnabled: user.twoFactorEnabled,
    accountStatus: userAccountStatusSchema.parse(user.accountStatus),
    accountStatusReason: user.accountStatusReason,
    suspendedUntil: user.suspendedUntil?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    role: user.assignedRole
      ? {
          id: user.assignedRole.role.id,
          name: user.assignedRole.role.name,
          description: user.assignedRole.role.description,
          isSystemRole: user.assignedRole.role.isSystemRole,
          assignedAt: user.assignedRole.assignedAt.toISOString(),
        }
      : null,
  };
}
