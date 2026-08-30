import assert from "node:assert/strict";
import test from "node:test";

import { addressIdParamsSchema } from "@cartura/contracts/addresses";
import { listAuditLogsQuerySchema } from "@cartura/contracts/audit-logs";
import {
  createRoleRequestSchema,
  listRolesQuerySchema,
  updateRoleRequestSchema,
} from "@cartura/contracts/authorization";

const permissionId = "0198a6ad-2f86-7a0a-8aca-123456789abc";

test("role PATCH cannot mutate permissions or accept an empty body", () => {
  assert.equal(updateRoleRequestSchema.safeParse({}).success, false);
  assert.equal(
    updateRoleRequestSchema.safeParse({ permissionIds: [permissionId] }).success,
    false,
  );
});

test("permission ids are deduplicated and list filters compose with pagination", () => {
  assert.deepEqual(
    createRoleRequestSchema.parse({
      name: "Support",
      permissionIds: [permissionId, permissionId],
    }).permissionIds,
    [permissionId],
  );
  assert.deepEqual(listRolesQuerySchema.parse({ page: "2", q: "support" }), {
    page: 2,
    limit: 20,
    q: "support",
  });
});

test("identity params and audit date ranges validate transport semantics", () => {
  assert.equal(
    addressIdParamsSchema.safeParse({ addressId: "not-a-uuid" }).success,
    false,
  );
  assert.equal(
    listAuditLogsQuerySchema.safeParse({
      from: "2026-08-11T10:00:00+02:00",
      to: "2026-08-11T08:30:00Z",
    }).success,
    true,
  );
  assert.equal(
    listAuditLogsQuerySchema.safeParse({
      from: "2026-08-11T09:00:00Z",
      to: "2026-08-11T08:30:00Z",
    }).success,
    false,
  );
});
