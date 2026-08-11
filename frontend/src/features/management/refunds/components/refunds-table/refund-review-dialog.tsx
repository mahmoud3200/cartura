"use client";

import type {
  Refund,
  RefundResolution,
  ReviewRefundRequest,
} from "@cartura/contracts/refunds";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { reviewRefundAction } from "../../actions/review-refund.action";

export function RefundReviewDialog({
  refund,
  onClose,
  onSaved,
}: {
  refund: Refund;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [decision, setDecision] = useState<"approve" | "reject">("approve");
  const [resolution, setResolution] = useState<RefundResolution>("pickup");
  const [pickupScheduledAt, setPickupScheduledAt] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    const input: ReviewRefundRequest =
      decision === "reject"
        ? { decision, reviewNote: reviewNote.trim() }
        : {
            decision,
            resolution,
            reviewNote: reviewNote.trim() || undefined,
            pickupScheduledAt:
              resolution === "pickup" && pickupScheduledAt
                ? new Date(pickupScheduledAt).toISOString()
                : undefined,
          };

    startTransition(async () => {
      const result = await reviewRefundAction(refund.id, input);

      if (!result.ok) {
        toast.error("Return review not saved", {
          description: result.message,
        });
        return;
      }

      toast.success(
        decision === "approve" ? "Return approved" : "Return rejected",
      );
      onSaved();
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="refund-review-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/85 p-4 backdrop-blur-sm"
    >
      <form
        className="my-auto w-full max-w-xl rounded-xl border border-border bg-card p-5 shadow-xl sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {refund.order.orderNumber}
        </p>
        <h2 id="refund-review-title" className="mt-2 text-xl font-semibold">
          Review return request
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Decide whether the customer keeps the items or a courier collects them.
          The refund is issued separately after this review.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
          <DecisionButton
            active={decision === "approve"}
            label="Approve"
            onClick={() => setDecision("approve")}
          />
          <DecisionButton
            active={decision === "reject"}
            label="Reject"
            onClick={() => setDecision("reject")}
          />
        </div>

        {decision === "approve" ? (
          <fieldset className="mt-5 space-y-3">
            <legend className="text-sm font-medium">Item resolution</legend>
            <ResolutionOption
              checked={resolution === "pickup"}
              title="Schedule a pickup"
              description="Restock only after staff confirms the returned items arrived."
              onChange={() => setResolution("pickup")}
            />
            <ResolutionOption
              checked={resolution === "keep_item"}
              title="Customer keeps the items"
              description="No inventory is added back. The refund can be issued immediately."
              onChange={() => setResolution("keep_item")}
            />
          </fieldset>
        ) : null}

        {decision === "approve" && resolution === "pickup" ? (
          <div className="mt-5 space-y-2">
            <Label htmlFor="refund-pickup-at">Pickup date and time</Label>
            <Input
              id="refund-pickup-at"
              type="datetime-local"
              value={pickupScheduledAt}
              onChange={(event) => setPickupScheduledAt(event.target.value)}
              min={toLocalDateTime(new Date())}
              required
              className="h-10"
            />
          </div>
        ) : null}

        <div className="mt-5 space-y-2">
          <Label htmlFor="refund-review-note">
            {decision === "reject"
              ? "Reason for rejection"
              : "Review note (optional)"}
          </Label>
          <textarea
            id="refund-review-note"
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            maxLength={1000}
            rows={4}
            required={decision === "reject"}
            className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-6 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant={decision === "reject" ? "destructive" : "default"}
            disabled={isPending}
          >
            {isPending
              ? "Saving..."
              : decision === "approve"
                ? "Approve return"
                : "Reject return"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function DecisionButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-2 text-sm font-medium transition ${active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
    >
      {label}
    </button>
  );
}

function ResolutionOption({
  checked,
  title,
  description,
  onChange,
}: {
  checked: boolean;
  title: string;
  description: string;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition ${checked ? "border-foreground/30 bg-muted/50" : "border-border hover:bg-muted/30"}`}
    >
      <input
        type="radio"
        name="resolution"
        checked={checked}
        onChange={onChange}
        className="mt-1 accent-foreground"
      />
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}

function toLocalDateTime(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
