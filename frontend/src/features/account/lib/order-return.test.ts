import type { Refund } from "@cartura/contracts/refunds";
import { describe, expect, it } from "vitest";

import { getOrderReturnPanelState } from "./order-return";

const now = new Date("2026-08-10T12:00:00.000Z");

describe("getOrderReturnPanelState", () => {
  it("offers a return for a recently completed order", () => {
    const state = getOrderReturnPanelState(
      {
        status: "completed",
        completedAt: "2026-08-01T12:00:00.000Z",
      },
      [],
      now,
    );

    expect(state.kind).toBe("request");
  });

  it("allows another request after a rejection and exposes the rejection", () => {
    const rejection = refundWithStatus("rejected", {
      reviewedAt: "2026-08-09T12:00:00.000Z",
      updatedAt: "2026-08-09T12:00:00.000Z",
    });
    const state = getOrderReturnPanelState(
      {
        status: "completed",
        completedAt: "2026-08-01T12:00:00.000Z",
      },
      [rejection],
      now,
    );

    expect(state).toMatchObject({
      kind: "request",
      previousRejection: rejection,
    });
    if (state.kind === "request") {
      expect(state.deadline.toISOString()).toBe("2026-08-23T12:00:00.000Z");
    }
  });

  it("shows an active return instead of another request", () => {
    const activeRefund = refundWithStatus("approved");
    const state = getOrderReturnPanelState(
      {
        status: "completed",
        completedAt: "2026-08-01T12:00:00.000Z",
      },
      [activeRefund],
      now,
    );

    expect(state).toEqual({ kind: "status", refund: activeRefund });
  });

  it("explains when the return window has ended", () => {
    const state = getOrderReturnPanelState(
      {
        status: "completed",
        completedAt: "2026-07-01T12:00:00.000Z",
      },
      [],
      now,
    );

    expect(state).toEqual({
      kind: "unavailable",
      message: "The 14-day return window for this order has ended.",
    });
  });
});

function refundWithStatus(
  status: Refund["status"],
  overrides: Partial<Refund> = {},
) {
  return { status, ...overrides } as Refund;
}
