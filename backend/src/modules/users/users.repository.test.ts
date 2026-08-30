import assert from "node:assert/strict";
import test from "node:test";

import { UsersRepository } from "./users.repository.js";

test("restricting an account revokes sessions in the status transaction", async () => {
  const operations: string[] = [];
  const transaction = {
    user: {
      updateMany: async () => {
        operations.push("status");
        return { count: 1 };
      },
      findUniqueOrThrow: async () => {
        operations.push("reload");
        return { id: "user-1" };
      },
    },
    authSession: {
      deleteMany: async (input: { where: { userId: string } }) => {
        operations.push(`sessions:${input.where.userId}`);
        return { count: 2 };
      },
    },
  };
  const database = {
    $transaction: async <T>(operation: (tx: typeof transaction) => Promise<T>) =>
      operation(transaction),
  };
  const repository = new UsersRepository(database as never);

  await repository.updateStatus(
    "user-1",
    { accountStatus: "disabled", statusReason: "Security review" },
    { updatedAt: new Date(), assignedRoleId: null },
  );

  assert.deepEqual(operations, ["status", "sessions:user-1", "reload"]);
});

test("activating an account does not revoke its sessions", async () => {
  let sessionDeletes = 0;
  const transaction = {
    user: {
      updateMany: async () => ({ count: 1 }),
      findUniqueOrThrow: async () => ({ id: "user-1" }),
    },
    authSession: {
      deleteMany: async () => {
        sessionDeletes += 1;
        return { count: 0 };
      },
    },
  };
  const database = {
    $transaction: async <T>(operation: (tx: typeof transaction) => Promise<T>) =>
      operation(transaction),
  };
  const repository = new UsersRepository(database as never);

  await repository.updateStatus(
    "user-1",
    { accountStatus: "active" },
    { updatedAt: new Date(), assignedRoleId: null },
  );

  assert.equal(sessionDeletes, 0);
});
