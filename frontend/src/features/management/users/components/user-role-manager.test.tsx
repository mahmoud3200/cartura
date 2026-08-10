import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { UserRoleManager } from "./user-role-manager";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("../actions/update-user-role.action", () => ({
  updateUserRoleAction: vi.fn(),
}));

vi.mock("@/shared/ui/popover", () => ({
  Popover: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverTrigger: (props: React.ComponentProps<"button">) => (
    <button {...props} />
  ),
  PopoverPortal: ({ children }: { children: ReactNode }) => <>{children}</>,
  PopoverPositioner: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  PopoverContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

const customerRole = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "customer",
  description: "Customer",
  isSystemRole: true,
  assignedAt: "2026-08-09T00:00:00.000Z",
};

const roleOptions = [
  {
    id: customerRole.id,
    name: "customer",
    description: "Customer",
    isSystemRole: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "support_agent",
    description: "Support agent",
    isSystemRole: true,
  },
];

describe("UserRoleManager", () => {
  it("renders an explicit role-changing control with the current role selected", () => {
    render(
      <UserRoleManager
        userId="33333333-3333-4333-8333-333333333333"
        userName="Mariam Hassan"
        role={customerRole}
        roleOptions={roleOptions}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Change role for Mariam Hassan" }),
    ).toBeTruthy();
    expect(screen.getByLabelText("New role for Mariam Hassan").textContent)
      .toContain("customer");
    expect(
      (screen.getByRole("button", {
        name: "Save role",
      }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("shows the protected state instead of a selector for super admin", () => {
    render(
      <UserRoleManager
        userId="44444444-4444-4444-8444-444444444444"
        userName="Super Admin"
        role={{ ...customerRole, name: "super_admin" }}
        roleOptions={roleOptions}
      />,
    );

    expect(screen.getByText(/managed by server bootstrap/i)).toBeTruthy();
    expect(screen.queryByLabelText("New role for Super Admin")).toBeNull();
  });
});
