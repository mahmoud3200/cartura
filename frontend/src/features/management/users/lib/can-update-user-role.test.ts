import { describe, expect, it } from "vitest";

import { canUpdateUserRole } from "./can-update-user-role";

const baseInput = {
  hasPermission: true,
  actingUserId: "admin-1",
  actingRoleName: "admin",
  targetUserId: "customer-1",
  targetRoleName: "customer",
};

describe("canUpdateUserRole", () => {
  it("prevents a custom role manager from changing their own role", () => {
    expect(canUpdateUserRole({
      ...baseInput,
      actingUserId: "role-manager-1",
      actingRoleName: "role_manager",
      targetUserId: "role-manager-1",
      targetRoleName: "role_manager",
    })).toBe(false);
  });

  it("prevents an admin from changing another admin's role", () => {
    expect(canUpdateUserRole({
      ...baseInput,
      targetUserId: "admin-2",
      targetRoleName: "admin",
    })).toBe(false);
  });

  it("allows a super admin to change an admin's role", () => {
    expect(canUpdateUserRole({
      ...baseInput,
      actingRoleName: "super_admin",
      targetUserId: "admin-2",
      targetRoleName: "admin",
    })).toBe(true);
  });

  it("prevents a custom role manager from changing an admin's role", () => {
    expect(canUpdateUserRole({
      ...baseInput,
      actingRoleName: "role_manager",
      targetUserId: "admin-2",
      targetRoleName: "admin",
    })).toBe(false);
  });
});
