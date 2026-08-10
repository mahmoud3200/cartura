import type { Prisma } from "../../generated/prisma/client.js";

export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    assignedRole: {
      include: {
        role: true;
      };
    };
  };
}>;
