import { describe, expect, it } from "vitest";

import {
  auditActorTypeOptions,
  formatAuditAction,
  getAuditActionsForResource,
  isAuditActionForResource,
} from "./audit-actions";

describe("audit action options", () => {
  it("shows only the actions belonging to the selected area", () => {
    expect(getAuditActionsForResource("product")).toEqual([
      { label: "Create", value: "product.create" },
      { label: "Update", value: "product.update" },
      { label: "Update inventory", value: "product.inventory.update" },
      { label: "Delete", value: "product.soft_delete" },
    ]);

    expect(getAuditActionsForResource("category")).toEqual([
      { label: "Create", value: "category.create" },
      { label: "Update", value: "category.update" },
      { label: "Delete", value: "category.soft_delete" },
    ]);
  });

  it("rejects an action from a different area", () => {
    expect(isAuditActionForResource("product", "product.create")).toBe(true);
    expect(isAuditActionForResource("category", "product.create")).toBe(false);
    expect(isAuditActionForResource(undefined, "product.create")).toBe(false);
  });

  it("uses friendly labels instead of storage terminology", () => {
    expect(formatAuditAction("product.soft_delete")).toBe("Delete");
    expect(formatAuditAction("category.soft_delete")).toBe("Delete");
    expect(formatAuditAction("unknown.action")).toBe("unknown action");
  });

  it("includes every actor type currently written by the backend", () => {
    expect(auditActorTypeOptions.map((option) => option.value)).toEqual([
      "user",
      "system",
      "provider",
    ]);
  });
});
