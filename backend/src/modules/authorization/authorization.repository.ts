import { prisma } from "../../infrastructure/database/prisma.js";

export class AuthorizationRepository {
  findPermissions() {
    return prisma.permission.findMany({
      orderBy: { name: "asc" },
    });
  }

  findRoles() {
    return prisma.role.findMany({
      orderBy: { name: "asc" },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  findRoleById(roleId: string) {
    return prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: true,
      },
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
  }) {
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

    return prisma.role.create({
      data: roleData,
    });
  }

  updateCustomRole(input: {
    roleId: string;
    name?: string | undefined;
    description?: string | undefined;
  }) {
    const data: { name?: string; description?: string | null } = {};

    if (input.name !== undefined) {
      data.name = input.name;
    }

    if (input.description !== undefined) {
      data.description = input.description;
    }

    return prisma.role.update({
      where: { id: input.roleId },
      data,
    });
  }

  async replaceRolePermissions(input: {
    roleId: string;
    permissionIds: string[];
  }): Promise<void> {
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({
        where: { roleId: input.roleId },
      }),
      prisma.rolePermission.createMany({
        data: input.permissionIds.map((permissionId) => ({
          roleId: input.roleId,
          permissionId,
        })),
        skipDuplicates: true,
      }),
    ]);
  }

  deleteRole(roleId: string) {
    return prisma.role.delete({
      where: { id: roleId },
    });
  }

  assignRole(input: {
    userId: string;
    roleId: string;
    assignedBy?: string | undefined;
  }) {
    return prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: input.userId,
          roleId: input.roleId,
        },
      },
      update: {},
      create: {
        userId: input.userId,
        roleId: input.roleId,
        assignedBy: input.assignedBy ?? null,
      },
    });
  }

  removeRole(input: { userId: string; roleId: string }) {
    return prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId: input.userId,
          roleId: input.roleId,
        },
      },
    });
  }
}

export const authorizationRepository = new AuthorizationRepository();
