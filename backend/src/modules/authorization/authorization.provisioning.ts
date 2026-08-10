import { prisma } from "../../infrastructure/database/prisma.js";
import { SYSTEM_ROLES } from "./authorization.constants.js";

export async function assignDefaultCustomerRole(userId: string): Promise<void> {
  const customerRole = await prisma.role.findUnique({
    where: {
      name: SYSTEM_ROLES.CUSTOMER,
    },
    select: {
      id: true,
    },
  });

  if (!customerRole) {
    throw new Error('The system role "customer" has not been seeded');
  }

  await prisma.userRole.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      roleId: customerRole.id,
      assignedBy: null,
    },
  });
}
