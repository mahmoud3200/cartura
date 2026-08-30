import assert from "node:assert/strict";
import { test } from "node:test";

import type { Prisma } from "../../../generated/prisma/client.js";
import { rebuildAffectedProductCategoryClosures } from "./categories-hierarchy.persistence.js";

test("reparent reconciliation replaces only inherited memberships", async () => {
  const rootA = "019fe859-331d-75b7-af23-55fd23031c13";
  const parentA = "019fe85d-9565-7510-bdea-082b0724bc1e";
  const rootB = "019fe86c-ddee-7561-853b-a9f2356643ed";
  const movedChild = "019fe8bb-9726-7f30-9e96-2487b5da5abf";
  const productId = "019fe8d5-aecd-757f-bd2a-6b6e9fbbb80d";
  const parents = new Map<string, string | null>([
    [rootA, null],
    [parentA, rootA],
    [rootB, null],
    [movedChild, rootB],
  ]);
  const created: Array<{
    productId: string;
    categoryId: string;
    isDirect: boolean;
  }> = [];
  const deleted: unknown[] = [];
  let membershipRead = 0;
  const tx = {
    category: {
      findMany: async (query: {
        where: {
          id?: { in: string[] };
          parentCategoryId?: { in: string[] };
        };
      }) => {
        if (query.where.parentCategoryId) return [];
        return (query.where.id?.in ?? []).map((id) => ({
          id,
          parentCategoryId: parents.get(id) ?? null,
        }));
      },
    },
    productCategory: {
      findMany: async () => {
        membershipRead += 1;
        return membershipRead === 1
          ? [{ productId }]
          : [{ categoryId: parentA }, { categoryId: movedChild }];
      },
      deleteMany: async (query: unknown) => {
        deleted.push(query);
        return { count: 2 };
      },
      createMany: async (query: { data: typeof created }) => {
        created.push(...query.data);
        return { count: query.data.length };
      },
    },
  } as unknown as Prisma.TransactionClient;

  await rebuildAffectedProductCategoryClosures(tx, movedChild);

  assert.deepEqual(deleted, [
    { where: { productId, isDirect: false } },
  ]);
  assert.deepEqual(
    new Set(created.map(({ categoryId }) => categoryId)),
    new Set([rootA, rootB]),
  );
  assert.equal(created.every(({ isDirect }) => isDirect === false), true);
});
