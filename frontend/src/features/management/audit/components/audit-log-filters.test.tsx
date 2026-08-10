import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AuditLogFilters } from "./audit-log-filters";

afterEach(cleanup);

describe("AuditLogFilters", () => {
  it("uses descriptive default labels and waits for an area before actions", () => {
    render(<AuditLogFilters />);

    expect(screen.getByLabelText("Audit area").textContent).toContain(
      "All areas",
    );

    const actionTrigger = screen.getByLabelText(
      "Audit action",
    ) as HTMLButtonElement;
    expect(actionTrigger.textContent).toContain("Select an area first");
    expect(actionTrigger.disabled).toBe(true);

    expect(screen.getByLabelText("Actor type").textContent).toContain(
      "All actor types",
    );
  });

  it("shows the selected area's action label", () => {
    render(
      <AuditLogFilters
        resourceType="product"
        action="product.inventory.update"
        actorType="staff"
      />,
    );

    expect(screen.getByLabelText("Audit area").textContent).toContain(
      "Products",
    );
    expect(screen.getByLabelText("Audit action").textContent).toContain(
      "Update inventory",
    );
    expect(screen.getByLabelText("Actor type").textContent).toContain("Staff");
  });
});
