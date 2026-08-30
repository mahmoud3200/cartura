import { hashPassword } from "better-auth/crypto";

import { env } from "../../config/env.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import {
  SYSTEM_ROLES,
  type SystemRoleName,
} from "./authorization.constants.js";

const developmentRoleUsers: ReadonlyArray<{
  role: Exclude<SystemRoleName, "super_admin">;
  firstName: string;
  lastName: string;
}> = [
  { role: SYSTEM_ROLES.CUSTOMER, firstName: "Mariam", lastName: "Hassan" },
  {
    role: SYSTEM_ROLES.SUPPORT_AGENT,
    firstName: "Youssef",
    lastName: "Nassar",
  },
  {
    role: SYSTEM_ROLES.CATALOG_MANAGER,
    firstName: "Nour",
    lastName: "Elmasry",
  },
  {
    role: SYSTEM_ROLES.ORDER_MANAGER,
    firstName: "Omar",
    lastName: "Fawzy",
  },
  { role: SYSTEM_ROLES.ADMIN, firstName: "Laila", lastName: "Adel" },
];

export async function seedDevelopmentRoleUsers(
  prisma: PrismaClient,
): Promise<void> {
  if (env.NODE_ENV !== "development") {
    return;
  }

  const password = await hashPassword(env.DEV_SEED_PASSWORD);
  const systemRoleNames = Object.values(SYSTEM_ROLES);
  const roles = await prisma.role.findMany({
    where: { name: { in: systemRoleNames } },
    select: { id: true, name: true },
  });
  const roleIdByName = new Map(roles.map((role) => [role.name, role.id]));

  for (const definition of developmentRoleUsers) {
    const roleId = roleIdByName.get(definition.role);

    if (!roleId) {
      throw new Error(`System role "${definition.role}" has not been seeded`);
    }

    const email = `dev.${definition.role.replaceAll("_", "-")}@cartura.local`;
    const name = `${definition.firstName} ${definition.lastName}`;

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email },
        update: {
          name,
          firstName: definition.firstName,
          lastName: definition.lastName,
          emailVerified: true,
          accountStatus: "active",
          accountStatusReason: null,
          suspendedUntil: null,
        },
        create: {
          email,
          name,
          firstName: definition.firstName,
          lastName: definition.lastName,
          emailVerified: true,
          accountStatus: "active",
        },
      });

      await tx.authAccountBetter.upsert({
        where: {
          providerId_accountId: {
            providerId: "credential",
            accountId: user.id,
          },
        },
        update: { password },
        create: {
          userId: user.id,
          accountId: user.id,
          providerId: "credential",
          password,
        },
      });

      await tx.userRole.upsert({
        where: { userId: user.id },
        update: {
          roleId,
          assignedBy: null,
          assignedAt: new Date(),
        },
        create: {
          userId: user.id,
          roleId,
          assignedBy: null,
        },
      });
    });
  }

  console.log("Development role users seeded.");
}
