import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { AuthUser } from "@cartura/contracts/auth";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AccountMenu } from "./account-menu";

vi.mock("@/features/auth/actions", () => ({
  logoutAction: vi.fn(),
}));

const user: AuthUser = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Staff Member",
  firstName: "Staff",
  lastName: "Member",
  email: "staff@example.com",
  emailVerified: true,
  image: null,
  twoFactorEnabled: false,
  accountStatus: "active",
  accountStatusReason: null,
  suspendedUntil: null,
  createdAt: "2026-08-19T00:00:00.000Z",
  updatedAt: "2026-08-19T00:00:00.000Z",
};

afterEach(cleanup);

describe("AccountMenu", () => {
  it("shows the dashboard link when the user has management access", async () => {
    render(<AccountMenu user={user} showDashboard />);

    fireEvent.click(
      screen.getByRole("button", { name: "Open account menu for Staff Member" }),
    );

    const dashboardLink = await screen.findByRole("menuitem", {
      name: "Dashboard",
    });

    expect(dashboardLink.getAttribute("href")).toBe("/dashboard");
  });

  it("hides the dashboard link without management access", async () => {
    render(<AccountMenu user={user} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Open account menu for Staff Member" }),
    );

    await screen.findByRole("menuitem", { name: "Account overview" });
    expect(screen.queryByRole("menuitem", { name: "Dashboard" })).toBeNull();
  });
});
