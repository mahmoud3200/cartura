"use client";

import type { OrderSummary } from "@cartura/contracts/orders";
import type { Refund, RefundReason } from "@cartura/contracts/refunds";
import { RotateCcw } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectItem,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import { useReturnRequest } from "../hooks/use-return-request";
import {
  formatAccountDate,
  formatAccountMoney,
} from "../lib/account-formatters";
import { RETURN_REASON_OPTIONS } from "../lib/order-return";
import { OrderRefundNotes } from "./order-refund-notes";

type OrderReturnRequestFormProps = {
  order: OrderSummary;
  deadline: Date;
  previousRejection?: Refund;
};

export function OrderReturnRequestForm({
  order,
  deadline,
  previousRejection,
}: OrderReturnRequestFormProps) {
  const form = useReturnRequest(order.id);
  const selectedReason = RETURN_REASON_OPTIONS.find(
    (option) => option.value === form.reason,
  );

  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <RotateCcw className="mt-0.5 size-5" strokeWidth={1.7} />
        <div>
          <h2 className="font-semibold">Request a return</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Request by {formatAccountDate(deadline.toISOString())}. The refund is{" "}
            {formatAccountMoney(
              order.payment?.amount ?? order.totalAmount,
              order.currency,
            )}{" "}
            through your original payment method.
          </p>
        </div>
      </div>

      {previousRejection ? (
        <div
          role="status"
          className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4"
        >
          <p className="text-sm font-semibold text-destructive">
            Previous request rejected
          </p>
          <OrderRefundNotes
            refund={previousRejection}
            className="mt-3 border-t border-destructive/20 pt-3"
          />
        </div>
      ) : null}

      <form className="mt-5 space-y-4" onSubmit={form.submit}>
        <div className="space-y-2">
          <Label htmlFor="return-reason">Reason</Label>
          <Select
            value={form.reason}
            onValueChange={(value) =>
              value && form.setReason(value as RefundReason)
            }
            items={RETURN_REASON_OPTIONS}
          >
            <SelectTrigger id="return-reason" className="h-10">
              <SelectValue>{selectedReason?.label}</SelectValue>
            </SelectTrigger>
            <SelectPortal>
              <SelectPositioner>
                <SelectPopup>
                  <SelectList>
                    {RETURN_REASON_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectList>
                </SelectPopup>
              </SelectPositioner>
            </SelectPortal>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="return-note">Additional note (optional)</Label>
          <textarea
            id="return-note"
            value={form.note}
            onChange={(event) => form.setNote(event.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="Describe the issue or add pickup details that may help."
            className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-6 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <p className="text-right text-xs text-muted-foreground">
            {form.note.length}/1000
          </p>
        </div>

        <Button type="submit" size="lg" disabled={form.isPending}>
          {form.isPending ? "Submitting..." : "Submit return request"}
        </Button>
      </form>
    </section>
  );
}
