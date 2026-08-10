import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { StorefrontMobileMenu } from "./storefront-mobile-menu";

afterEach(cleanup);

describe("StorefrontMobileMenu", () => {
  it("opens search and the primary storefront links from one menu button", async () => {
    render(<StorefrontMobileMenu />);

    const trigger = screen.getByRole("button", { name: "Open menu" });
    fireEvent.click(trigger);

    expect(trigger.getAttribute("aria-label")).toBe("Close menu");
    expect(await screen.findByRole("search")).toBeTruthy();
    expect(screen.getByLabelText("Search products")).toBeTruthy();

    for (const label of ["Categories", "Shop", "About us", "Contact us"]) {
      expect(screen.getByRole("link", { name: label })).toBeTruthy();
    }
  });

  it("closes from the same menu button", async () => {
    render(<StorefrontMobileMenu />);

    const trigger = screen.getByRole("button", { name: "Open menu" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));

    expect(trigger.getAttribute("aria-label")).toBe("Open menu");
  });
});
