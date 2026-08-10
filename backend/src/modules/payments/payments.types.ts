import type { Prisma } from "../../generated/prisma/client.js";

export type PaymentWithOrder = Prisma.PaymentGetPayload<{
  include: {
    order: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            firstName: true;
            lastName: true;
            email: true;
          };
        };
        items: true;
      };
    };
    refunds: true;
  };
}>;
