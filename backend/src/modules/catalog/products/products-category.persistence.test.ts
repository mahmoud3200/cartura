import assert from "node:assert/strict";
import { test } from "node:test";

import type { Prisma } from "../../../generated/prisma/client.js";
import { resolveCategoryMembershipForWrite } from "./products-category.persistence.js";

test("category closure preserves explicit parent and descendant memberships", async () => {
  const rootId = "019fe859-331d-75b7-af23-55fd23031c13";
  const parentId = "019fe85d-9565-7510-bdea-082b0724bc1e";
  const childId = "019fe86c-ddee-7561-853b-a9f2356643ed";
  const parents = new Map<string, string | null>([
    [rootId, null],
    [parentId, rootId],
    [childId, parentId],
  ]);
  const tx = {
    category: {
      findMany: async (query: { where: { id: { in: string[] } } }) =>
        query.where.id.in.flatMap((id) =>
          parents.has(id)
            ? [{ id, parentCategoryId: parents.get(id) ?? null }]
            : [],
        ),
    },
  } as unknown as Prisma.TransactionClient;

  const membership = await resolveCategoryMembershipForWrite(
    tx,
    [parentId, childId],
  );

  assert.deepEqual(membership.directIds, [parentId, childId]);
  assert.deepEqual(new Set(membership.expandedIds), new Set([
    rootId,
    parentId,
    childId,
  ]));
});
