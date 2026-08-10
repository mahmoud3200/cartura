import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OAuthButtons } from "./oauth-buttons";

vi.mock("../api/oauth-client", () => ({
  startGoogleOAuth: vi.fn(),
}));

describe("OAuthButtons", () => {
  it("submits registration context and the post-auth destination", () => {
    const { container } = render(
      <OAuthButtons flow="register" redirectTo="/settings/orders" />,
    );

    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeTruthy();
    expect(
      container.querySelector<HTMLInputElement>('input[name="flow"]')?.value,
    ).toBe("register");
    expect(
      container.querySelector<HTMLInputElement>('input[name="redirectTo"]')
        ?.value,
    ).toBe("/settings/orders");
  });

  it("shows an accessible provider error", () => {
    render(<OAuthButtons flow="login" error="state_mismatch" />);

    expect(screen.getByRole("alert").textContent).toContain("sign-up cookie");
  });
});
