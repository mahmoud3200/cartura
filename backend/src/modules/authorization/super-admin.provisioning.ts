import { hashPassword } from "better-auth/crypto";

import { env } from "../../config/env.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { SYSTEM_ROLES } from "./authorization.constants.js";

export async function provisionConfiguredSuperAdmin(): Promise<void> {
  if (!env.SUPER_ADMIN_BOOTSTRAP_ENABLED) {
    return;
  }

  const email = env.SUPER_ADMIN_EMAIL.toLowerCase();
  const firstName = env.SUPER_ADMIN_FIRST_NAME;
  const lastName = env.SUPER_ADMIN_LAST_NAME;
  const name =
    `${env.SUPER_ADMIN_FIRST_NAME} ${env.SUPER_ADMIN_LAST_NAME}`.trim();
  const role = await prisma.role.findUnique({
    where: { name: SYSTEM_ROLES.SUPER_ADMIN },
    select: { id: true },
  });

  if (!role) {
    throw new Error('The system role "super_admin" has not been seeded');
  }

  const customerRole = await prisma.role.findUnique({
    where: { name: SYSTEM_ROLES.CUSTOMER },
    select: { id: true },
  });

  if (!customerRole) {
    throw new Error('The system role "customer" has not been seeded');
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      accounts: {
        where: {
          providerId: "credential",
        },
      },
    },
  });

  if (
    (!user || user.accounts.length === 0) &&
    env.SUPER_ADMIN_PASSWORD.length < 8
  ) {
    throw new Error(
      "SUPER_ADMIN_PASSWORD must be set to bootstrap the configured super admin credential login",
    );
  }

  const superAdminUser = user
    ? await prisma.user.update({
        where: { id: user.id },
        data: {
          name,
          firstName,
          lastName,
          emailVerified: true,
          accountStatus: "active",
          accountStatusReason: null,
          suspendedUntil: null,
        },
      })
    : await createSuperAdminUser({
        email,
        firstName,
        lastName,
        name,
      });

  if (user && user.accounts.length === 0) {
    await prisma.authAccountBetter.create({
      data: {
        userId: superAdminUser.id,
        accountId: superAdminUser.id,
        providerId: "credential",
        password: await hashPassword(env.SUPER_ADMIN_PASSWORD),
      },
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.userRole.updateMany({
      where: {
        roleId: role.id,
        userId: {
          not: superAdminUser.id,
        },
      },
      data: {
        roleId: customerRole.id,
        assignedBy: null,
        assignedAt: new Date(),
      },
    });

    await tx.userRole.upsert({
      where: { userId: superAdminUser.id },
      update: {
        roleId: role.id,
        assignedBy: null,
        assignedAt: new Date(),
      },
      create: {
        userId: superAdminUser.id,
        roleId: role.id,
        assignedBy: null,
      },
    });
  });
}

async function createSuperAdminUser(input: {
  email: string;
  firstName: string;
  lastName: string;
  name: string;
}) {
  const password = await hashPassword(env.SUPER_ADMIN_PASSWORD);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        name: input.name,
        firstName: input.firstName,
        lastName: input.lastName,
        emailVerified: true,
        accountStatus: "active",
      },
    });

    await tx.authAccountBetter.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password,
      },
    });

    return user;
  });
}
