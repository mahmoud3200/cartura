import assert from "node:assert/strict";
import test from "node:test";

import { getUserRoleUpdateDenial } from "./authorization.policy.js";

test("a user cannot change their own role", () => {
  assert.equal(
    getUserRoleUpdateDenial({
      actingUserId: "role-manager-1",
      actingRoleName: "role_manager",
      targetUserId: "role-manager-1",
      targetRoleName: "role_manager",
    }),
    "self_role_change",
  );
});

test("an admin cannot change another admin's role", () => {
  assert.equal(
    getUserRoleUpdateDenial({
      actingUserId: "admin-1",
      actingRoleName: "admin",
      targetUserId: "admin-2",
      targetRoleName: "admin",
    }),
    "protected_role_change",
  );
});

test("a custom role manager cannot change an admin's role", () => {
  assert.equal(
    getUserRoleUpdateDenial({
      actingUserId: "role-manager-1",
      actingRoleName: "role_manager",
      targetUserId: "admin-1",
      targetRoleName: "admin",
    }),
    "protected_role_change",
  );
});

test("an admin can change a non-admin user's role", () => {
  assert.equal(
    getUserRoleUpdateDenial({
      actingUserId: "admin-1",
      actingRoleName: "admin",
      targetUserId: "customer-1",
      targetRoleName: "customer",
    }),
    null,
  );
});

test("the admin restriction does not limit the super admin", () => {
  assert.equal(
    getUserRoleUpdateDenial({
      actingUserId: "super-admin-1",
      actingRoleName: "super_admin",
      targetUserId: "admin-1",
      targetRoleName: "admin",
    }),
    null,
  );
});
