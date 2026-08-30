import type { Prisma } from "../../generated/prisma/client.js";

export const paymentInclude = {
  order: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      items: true,
    },
  },
  refunds: true,
} satisfies Prisma.PaymentInclude;

export type PaymentWithOrder = Prisma.PaymentGetPayload<{
  include: typeof paymentInclude;
}>;
