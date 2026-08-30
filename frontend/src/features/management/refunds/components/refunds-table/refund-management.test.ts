import { describe, expect, it } from "vitest";

import {
  getRefundExecutionFeedback,
  getRefundManagementActions,
} from "./refund-management";

describe("refund management actions", () => {
  it.each(["approved", "item_received", "failed"] as const)(
    "allows staff to issue or retry a %s refund",
    (status) => {
      expect(getRefundManagementActions({ status })).toEqual(["issue"]);
    },
  );

  it("does not offer execution while provider completion is uncertain", () => {
    expect(getRefundManagementActions({ status: "processing" })).toEqual([]);
  });
});

describe("refund execution feedback", () => {
  it("does not report an explicit provider failure as a success", () => {
    const feedback = getRefundExecutionFeedback({
      status: "failed",
      failureReason: "Provider rejected the request",
    });

    expect(feedback).toEqual({
      kind: "error",
      title: "Refund was not completed",
      description: "Provider rejected the request",
    });
  });

  it("calls out uncertain processing for manual review", () => {
    const feedback = getRefundExecutionFeedback({
      status: "processing",
      failureReason: "Manual reconciliation is required",
    });

    expect(feedback.kind).toBe("error");
    expect(feedback.title).toBe("Refund needs manual review");
  });
});

