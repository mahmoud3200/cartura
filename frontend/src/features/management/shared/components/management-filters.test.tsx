import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ManagementFilters } from "./management-filters";

afterEach(cleanup);

describe("ManagementFilters", () => {
  it("keeps the Base UI search input controlled when URL state changes", () => {
    const { rerender } = render(
      <ManagementFilters
        action="/dashboard/audit"
        query="mona"
        queryPlaceholder="Search actor name or email"
      />,
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("mona");

    rerender(
      <ManagementFilters
        action="/dashboard/audit"
        query="ali@example.com"
        queryPlaceholder="Search actor name or email"
      />,
    );

    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe(
      "ali@example.com",
    );
  });
});
