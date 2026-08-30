import type {
  CreateAddressRequest,
  UpdateAddressRequest,
} from "@cartura/contracts/addresses";

import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

export class AddressesRepository {
  listByUserId(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
        { id: "desc" },
      ],
    });
  }

  findByIdForUser(userId: string, addressId: string) {
    return prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });
  }

  createWithInvariants(
    userId: string,
    input: CreateAddressRequest,
    maxAddressesPerUser: number,
  ) {
    return prisma.$transaction(async (tx) => {
      await lockUserAddressWrites(tx, userId);
      const addressCount = await tx.address.count({ where: { userId } });

      if (addressCount >= maxAddressesPerUser) {
        return { kind: "limit_reached" as const };
      }

      const isDefault = addressCount === 0 || input.isDefault === true;
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const address = await tx.address.create({
        data: {
          userId,
          addressName: input.addressName,
          recipientName: input.recipientName,
          phoneNumber: input.phoneNumber,
          country: input.country,
          city: input.city,
          area: input.area,
          streetAddress: input.streetAddress,
          postalCode: input.postalCode ?? null,
          isDefault,
        },
      });

      return { kind: "created" as const, address };
    });
  }

  update(userId: string, addressId: string, input: UpdateAddressRequest) {
    const data: Prisma.AddressUpdateInput = {};

    if (input.addressName !== undefined) data.addressName = input.addressName;
    if (input.recipientName !== undefined) {
      data.recipientName = input.recipientName;
    }
    if (input.phoneNumber !== undefined) data.phoneNumber = input.phoneNumber;
    if (input.country !== undefined) data.country = input.country;
    if (input.city !== undefined) data.city = input.city;
    if (input.area !== undefined) data.area = input.area;
    if (input.streetAddress !== undefined) {
      data.streetAddress = input.streetAddress;
    }
    if (input.postalCode !== undefined) data.postalCode = input.postalCode;

    return prisma.$transaction(async (tx) => {
      await lockUserAddressWrites(tx, userId);
      const address = await tx.address.findFirst({
        where: { id: addressId, userId },
      });

      if (!address) {
        return null;
      }

      return tx.address.update({
        where: { id: addressId },
        data,
      });
    });
  }

  setDefault(userId: string, addressId: string) {
    return prisma.$transaction(async (tx) => {
      await lockUserAddressWrites(tx, userId);
      const address = await tx.address.findFirst({
        where: { id: addressId, userId },
      });

      if (!address) {
        return null;
      }

      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      return tx.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });
  }

  delete(userId: string, addressId: string) {
    return prisma.$transaction(async (tx) => {
      await lockUserAddressWrites(tx, userId);
      const address = await tx.address.findFirst({
        where: { id: addressId, userId },
      });

      if (!address) {
        return null;
      }

      await tx.address.delete({
        where: { id: addressId },
      });

      if (address.isDefault) {
        const newestRemaining = await tx.address.findFirst({
          where: { userId },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        });

        if (newestRemaining) {
          await tx.address.update({
            where: { id: newestRemaining.id },
            data: { isDefault: true },
          });
        }
      }

      return address;
    });
  }
}

export const addressesRepository = new AddressesRepository();

async function lockUserAddressWrites(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<void> {
  await tx.$queryRaw`
    SELECT "id"
    FROM "users"
    WHERE "id" = ${userId}::uuid
    FOR UPDATE
  `;
}
