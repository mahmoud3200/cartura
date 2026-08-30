import { prisma } from "../../infrastructure/database/prisma.js";
import { SYSTEM_ROLES } from "./authorization.constants.js";

export type SuperAdminProvisioningInput = {
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  passwordHash?: string | undefined;
};

export class AuthorizationProvisioningRepository {
  provisionSuperAdmin(input: SuperAdminProvisioningInput): Promise<void> {
    return prisma.$transaction(async (tx) => {
      const [superAdminRole, customerRole, existingUser] = await Promise.all([
        tx.role.findUnique({
          where: { name: SYSTEM_ROLES.SUPER_ADMIN },
          select: { id: true },
        }),
        tx.role.findUnique({
          where: { name: SYSTEM_ROLES.CUSTOMER },
          select: { id: true },
        }),
        tx.user.findUnique({
          where: { email: input.email },
          include: {
            accounts: {
              where: { providerId: "credential" },
              select: { id: true },
            },
          },
        }),
      ]);

      if (!superAdminRole) {
        throw new Error('The system role "super_admin" has not been seeded');
      }

      if (!customerRole) {
        throw new Error('The system role "customer" has not been seeded');
      }

      const needsCredential = !existingUser || existingUser.accounts.length === 0;
      const passwordHash = input.passwordHash;

      const user = await tx.user.upsert({
        where: { email: input.email },
        update: {
          name: input.name,
          firstName: input.firstName,
          lastName: input.lastName,
          emailVerified: true,
          accountStatus: "active",
          accountStatusReason: null,
          suspendedUntil: null,
        },
        create: {
          email: input.email,
          name: input.name,
          firstName: input.firstName,
          lastName: input.lastName,
          emailVerified: true,
          accountStatus: "active",
        },
      });

      if (needsCredential) {
        if (!passwordHash) {
          throw new Error(
            "SUPER_ADMIN_PASSWORD must be set to bootstrap the configured super admin credential login",
          );
        }

        await tx.authAccountBetter.create({
          data: {
            userId: user.id,
            accountId: user.id,
            providerId: "credential",
            password: passwordHash,
          },
        });
      }

      await tx.userRole.updateMany({
        where: {
          roleId: superAdminRole.id,
          userId: { not: user.id },
        },
        data: {
          roleId: customerRole.id,
          assignedBy: null,
          assignedAt: new Date(),
        },
      });

      await tx.userRole.upsert({
        where: { userId: user.id },
        update: {
          roleId: superAdminRole.id,
          assignedBy: null,
          assignedAt: new Date(),
        },
        create: {
          userId: user.id,
          roleId: superAdminRole.id,
          assignedBy: null,
        },
      });
    });
  }
}

export const authorizationProvisioningRepository =
  new AuthorizationProvisioningRepository();
