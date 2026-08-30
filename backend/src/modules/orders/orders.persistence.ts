import { Prisma } from "../../generated/prisma/client.js";

export const orderInclude = {
  user: {
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  address: true,
  items: true,
  payment: true,
  statusHistory: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.OrderInclude;

export const awaitingPaymentOrderInclude = {
  user: { select: { id: true, email: true } },
  items: true,
  payment: true,
} satisfies Prisma.OrderInclude;

export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;

export type AwaitingPaymentOrder = Prisma.OrderGetPayload<{
  include: typeof awaitingPaymentOrderInclude;
}>;
