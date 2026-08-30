import type { ListRolesQuery } from "@cartura/contracts/authorization";
import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { auditLogsRepository } from "../audit-logs/audit-logs.repository.js";
import type { RecordAuditLogInput } from "../audit-logs/audit-logs.types.js";
import {
  createPaginatedResult,
  getPaginationParams,
} from "../../shared/pagination/pagination.js";

const roleWithPermissionsInclude = {
  rolePermissions: {
    orderBy: { permissionId: "asc" },
    include: {
      permission: true,
    },
  },
} satisfies Prisma.RoleInclude;

export class AuthorizationRepository {
  findPermissions() {
    return prisma.permission.findMany({
      orderBy: { name: "asc" },
    });
  }

  async findPermissionIds(permissionIds: readonly string[]) {
    if (permissionIds.length === 0) {
      return [];
    }

    const permissions = await prisma.permission.findMany({
      where: { id: { in: [...permissionIds] } },
      select: { id: true },
      orderBy: { id: "asc" },
    });

    return permissions.map((permission) => permission.id);
  }

  async findRoles(query: ListRolesQuery) {
    const where = buildRoleWhere(query);
    const { skip, take } = getPaginationParams(query);

    const [items, total] = await Promise.all([
      prisma.role.findMany({
        where,
        skip,
        take,
        orderBy: { name: "asc" },
        include: roleWithPermissionsInclude,
      }),
      prisma.role.count({ where }),
    ]);

    return createPaginatedResult(items, total, query);
  }

  findRoleById(roleId: string) {
    return prisma.role.findUnique({
      where: { id: roleId },
      include: roleWithPermissionsInclude,
    });
  }

  findRoleByName(name: string) {
    return prisma.role.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
  }

  findAssignableUserRoles() {
    return prisma.role.findMany({
      where: {
        name: { not: "super_admin" },
      },
      select: {
        id: true,
        name: true,
        description: true,
        isSystemRole: true,
      },
      orderBy: { name: "asc" },
    });
  }

  async findUserPermissionNames(userId: string): Promise<string[]> {
    const permissions = await prisma.permission.findMany({
      where: {
        rolePermissions: {
          some: {
            role: {
              userRoles: {
                some: {
                  userId,
                },
              },
            },
          },
        },
      },
      select: {
        name: true,
      },
    });

    return permissions.map((permission) => permission.name);
  }

  createCustomRole(input: {
    name: string;
    description?: string | undefined;
    permissionIds: string[];
  }, audit?: RecordAuditLogInput) {
    const roleData = {
      name: input.name,
      description: input.description ?? null,
      isSystemRole: false,
      rolePermissions: {
        create: input.permissionIds.map((permissionId) => ({
          permissionId,
        })),
      },
    };

    return prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: roleData,
        include: roleWithPermissionsInclude,
      });

      if (audit) {
        await auditLogsRepository.create({
          ...audit,
          resourceId: role.id,
        }, tx);
      }

      return role;
    });
  }

  updateCustomRole(input: {
    roleId: string;
    name?: string | undefined;
    description?: string | null | undefined;
  }, audit?: RecordAuditLogInput) {
    const data: { name?: string; description?: string | null } = {};

    if (input.name !== undefined) {
      data.name = input.name;
    }

    if (input.description !== undefined) {
      data.description = input.description;
    }

    return prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id: input.roleId },
        data,
      });

      if (audit) {
        await auditLogsRepository.create(audit, tx);
      }

      return tx.role.findUniqueOrThrow({
        where: { id: input.roleId },
        include: roleWithPermissionsInclude,
      });
    });
  }

  async replaceRolePermissions(input: {
    roleId: string;
    permissionIds: string[];
  }, audit?: RecordAuditLogInput): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const previousPermissions = await tx.rolePermission.findMany({
        where: { roleId: input.roleId },
        select: { permissionId: true },
        orderBy: { permissionId: "asc" },
      });

      await tx.rolePermission.deleteMany({
        where: { roleId: input.roleId },
      });

      if (input.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: input.permissionIds.map((permissionId) => ({
            roleId: input.roleId,
            permissionId,
          })),
        });
      }

      if (audit) {
        await auditLogsRepository.create({
          ...audit,
          metadata: {
            ...(isJsonObject(audit.metadata) ? audit.metadata : {}),
            previous: {
              permissionIds: previousPermissions.map((permission) =>
                permission.permissionId
              ),
            },
            next: {
              permissionIds: input.permissionIds,
            },
          },
        }, tx);
      }
    });
  }

  deleteRole(
    roleId: string,
    customerRoleId: string,
    audit?: RecordAuditLogInput,
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.userRole.updateMany({
        where: { roleId },
        data: {
          roleId: customerRoleId,
          assignedBy: null,
          assignedAt: new Date(),
        },
      });

      const role = await tx.role.delete({
        where: { id: roleId },
      });

      if (audit) {
        await auditLogsRepository.create(audit, tx);
      }

      return role;
    });
  }

  findUserRole(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        assignedRole: {
          include: { role: true },
        },
      },
    });
  }

  replaceUserRole(
    input: {
      userId: string;
      roleId: string;
      assignedBy?: string | undefined;
    },
    audit?: RecordAuditLogInput,
  ) {
    return prisma.$transaction(async (tx) => {
      const userRole = await tx.userRole.upsert({
        where: { userId: input.userId },
        update: {
          roleId: input.roleId,
          assignedBy: input.assignedBy ?? null,
          assignedAt: new Date(),
        },
        create: {
          userId: input.userId,
          roleId: input.roleId,
          assignedBy: input.assignedBy ?? null,
        },
      });

      if (audit) {
        await auditLogsRepository.create(audit, tx);
      }

      return userRole;
    });
  }
}

function isJsonObject(
  value: Prisma.InputJsonValue | undefined,
): value is Prisma.InputJsonObject {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export type RoleWithPermissions = Prisma.RoleGetPayload<{
  include: typeof roleWithPermissionsInclude;
}>;

function buildRoleWhere(query: ListRolesQuery): Prisma.RoleWhereInput {
  if (!query.q) {
    return {};
  }

  return {
    OR: [
      { name: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
      {
        rolePermissions: {
          some: {
            permission: {
              name: { contains: query.q, mode: "insensitive" },
            },
          },
        },
      },
    ],
  };
}

export const authorizationRepository = new AuthorizationRepository();
