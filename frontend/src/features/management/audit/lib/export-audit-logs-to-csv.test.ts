import type { AuditLog } from "@cartura/contracts/audit-logs";
import { describe, expect, it } from "vitest";

import { createAuditLogsCsv } from "./export-audit-logs-to-csv";

const log: AuditLog = {
  id: "0198a850-2479-7bd8-a8e5-bf2345c60f11",
  actorUserId: "0198a850-2479-7bd8-a8e5-bf2345c60f12",
  actorType: "user",
  actor: {
    id: "0198a850-2479-7bd8-a8e5-bf2345c60f12",
    name: "Mona, Ali",
    firstName: "Mona",
    lastName: "Ali",
    email: "mona@example.com",
  },
  action: "product.update",
  resourceType: "product",
  resourceId: "0198a850-2479-7bd8-a8e5-bf2345c60f13",
  resourceLabel: 'Linen "Shirt"',
  requestId: "request-123",
  ipAddress: "127.0.0.1",
  userAgent: null,
  metadata: { status: "active" },
  createdAt: "2026-07-26T00:00:00.000Z",
};

describe("createAuditLogsCsv", () => {
  it("escapes commas and quotes while preserving useful audit fields", () => {
    const csv = createAuditLogsCsv([log]);

    expect(csv).toContain('"Mona, Ali"');
    expect(csv).toContain('"Linen ""Shirt"""');
    expect(csv).toContain('"mona@example.com"');
    expect(csv).toContain('"2026-07-26T00:00:00.000Z"');
  });
});
