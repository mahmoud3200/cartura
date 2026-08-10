// You can find the file that runs this seed in: "/prisma/seed.ts"

import type { PrismaClient } from "../../generated/prisma/client.js";
import {
  PERMISSIONS,
  SYSTEM_ROLES,
  type PermissionName,
} from "./authorization.constants.js";

export const permissionDefinitions: ReadonlyArray<{
  name: PermissionName;
  description: string;
}> = [
  {
    name: PERMISSIONS.USERS_READ,
    description: "View users and their account information",
  },
  {
    name: PERMISSIONS.USERS_UPDATE_STATUS,
    description: "Activate, suspend, or disable user accounts",
  },
  {
    name: PERMISSIONS.USERS_UPDATE_ROLE,
    description: "Change the single role assigned to a user",
  },
  {
    name: PERMISSIONS.ROLES_READ,
    description: "View roles and their permissions",
  },
  {
    name: PERMISSIONS.ROLES_CREATE,
    description: "Create custom roles",
  },
  {
    name: PERMISSIONS.ROLES_UPDATE,
    description: "Update custom roles",
  },
  {
    name: PERMISSIONS.ROLES_DELETE,
    description: "Delete custom roles",
  },
  {
    name: PERMISSIONS.ROLES_UPDATE_PERMISSIONS,
    description: "Change the permissions assigned to custom roles",
  },
  {
    name: PERMISSIONS.CATEGORIES_CREATE,
    description: "Create product categories",
  },
  {
    name: PERMISSIONS.CATEGORIES_UPDATE,
    description: "Update product categories",
  },
  {
    name: PERMISSIONS.CATEGORIES_DELETE,
    description: "Delete product categories",
  },
  {
    name: PERMISSIONS.PRODUCTS_CREATE,
    description: "Create products",
  },
  {
    name: PERMISSIONS.PRODUCTS_UPDATE,
    description: "Update products",
  },
  {
    name: PERMISSIONS.PRODUCTS_DELETE,
    description: "Delete products",
  },
  {
    name: PERMISSIONS.INVENTORY_UPDATE,
    description: "Change product inventory quantities",
  },
  {
    name: PERMISSIONS.ORDERS_READ,
    description: "View orders belonging to any customer",
  },
  {
    name: PERMISSIONS.ORDERS_UPDATE,
    description: "Update order status and operational information",
  },
  {
    name: PERMISSIONS.REFUNDS_READ,
    description: "View refund records",
  },
  {
    name: PERMISSIONS.REFUNDS_CREATE,
    description: "Initiate refunds",
  },
  {
    name: PERMISSIONS.REFUNDS_EXECUTE,
    description: "Execute requested refunds with the payment provider",
  },
  {
    name: PERMISSIONS.PAYMENT_WEBHOOKS_READ,
    description: "View payment webhook events",
  },
  {
    name: PERMISSIONS.PAYMENT_WEBHOOKS_REPROCESS,
    description: "Reprocess failed payment webhook events",
  },
  {
    name: PERMISSIONS.ANALYTICS_READ,
    description: "View operational analytics and dashboard summaries",
  },
  {
    name: PERMISSIONS.AUDIT_LOGS_READ,
    description: "View administrative audit logs",
  },
];

export const systemRoleDefinitions: ReadonlyArray<{
  name: string;
  description: string;
  permissions: readonly PermissionName[];
}> = [
  {
    name: SYSTEM_ROLES.CUSTOMER,
    description: "Default role assigned to registered customers",
    permissions: [],
  },
  {
    name: SYSTEM_ROLES.SUPPORT_AGENT,
    description: "Customer support and order investigation",
    permissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.ORDERS_READ,
      PERMISSIONS.REFUNDS_READ,
    ],
  },
  {
    name: SYSTEM_ROLES.CATALOG_MANAGER,
    description: "Manages the product catalog and inventory",
    permissions: [
      PERMISSIONS.CATEGORIES_CREATE,
      PERMISSIONS.CATEGORIES_UPDATE,
      PERMISSIONS.CATEGORIES_DELETE,
      PERMISSIONS.PRODUCTS_CREATE,
      PERMISSIONS.PRODUCTS_UPDATE,
      PERMISSIONS.PRODUCTS_DELETE,
      PERMISSIONS.INVENTORY_UPDATE,
    ],
  },
  {
    name: SYSTEM_ROLES.ORDER_MANAGER,
    description: "Manages orders and refunds",
    permissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.ORDERS_READ,
      PERMISSIONS.ORDERS_UPDATE,
      PERMISSIONS.REFUNDS_READ,
      PERMISSIONS.REFUNDS_CREATE,
      PERMISSIONS.REFUNDS_EXECUTE,
      PERMISSIONS.PAYMENT_WEBHOOKS_READ,
      PERMISSIONS.PAYMENT_WEBHOOKS_REPROCESS,
      PERMISSIONS.ANALYTICS_READ,
    ],
  },
  {
    name: SYSTEM_ROLES.ADMIN,
    description: "Manages Cartura business operations",
    permissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.USERS_UPDATE_STATUS,
      PERMISSIONS.USERS_UPDATE_ROLE,
      PERMISSIONS.CATEGORIES_CREATE,
      PERMISSIONS.CATEGORIES_UPDATE,
      PERMISSIONS.CATEGORIES_DELETE,
      PERMISSIONS.PRODUCTS_CREATE,
      PERMISSIONS.PRODUCTS_UPDATE,
      PERMISSIONS.PRODUCTS_DELETE,
      PERMISSIONS.INVENTORY_UPDATE,
      PERMISSIONS.ORDERS_READ,
      PERMISSIONS.ORDERS_UPDATE,
      PERMISSIONS.REFUNDS_READ,
      PERMISSIONS.REFUNDS_CREATE,
      PERMISSIONS.REFUNDS_EXECUTE,
      PERMISSIONS.PAYMENT_WEBHOOKS_READ,
      PERMISSIONS.PAYMENT_WEBHOOKS_REPROCESS,
      PERMISSIONS.ANALYTICS_READ,
      PERMISSIONS.AUDIT_LOGS_READ,
    ],
  },
  {
    name: SYSTEM_ROLES.SUPER_ADMIN,
    description: "Full system and authorization administration",
    permissions: permissionDefinitions.map((permission) => permission.name),
  },
];

export async function seedAuthorization(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const permission of permissionDefinitions) {
      await tx.permission.upsert({
        where: { name: permission.name },
        update: { description: permission.description },
        create: permission,
      });
    }

    const permissions = await tx.permission.findMany({
      where: {
        name: {
          in: permissionDefinitions.map((permission) => permission.name),
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const permissionIdByName = new Map(
      permissions.map((permission) => [permission.name, permission.id]),
    );

    for (const roleDefinition of systemRoleDefinitions) {
      const role = await tx.role.upsert({
        where: { name: roleDefinition.name },
        update: {
          description: roleDefinition.description,
          isSystemRole: true,
        },
        create: {
          name: roleDefinition.name,
          description: roleDefinition.description,
          isSystemRole: true,
        },
      });

      await tx.rolePermission.deleteMany({
        where: { roleId: role.id },
      });

      const rolePermissions = roleDefinition.permissions.map(
        (permissionName) => {
          const permissionId = permissionIdByName.get(permissionName);

          if (!permissionId) {
            throw new Error(`Permission "${permissionName}" was not seeded`);
          }

          return {
            roleId: role.id,
            permissionId,
          };
        },
      );

      if (rolePermissions.length > 0) {
        await tx.rolePermission.createMany({
          data: rolePermissions,
          skipDuplicates: true,
        });
      }
    }

    const customerRole = await tx.role.findUniqueOrThrow({
      where: { name: SYSTEM_ROLES.CUSTOMER },
      select: { id: true },
    });

    const usersWithoutRoles = await tx.user.findMany({
      where: {
        assignedRole: null,
      },
      select: { id: true },
    });

    if (usersWithoutRoles.length > 0) {
      await tx.userRole.createMany({
        data: usersWithoutRoles.map((user) => ({
          userId: user.id,
          roleId: customerRole.id,
        })),
        skipDuplicates: true,
      });
    }
  });
}
