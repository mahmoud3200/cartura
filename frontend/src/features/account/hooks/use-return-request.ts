"use client";

import type { RefundReason } from "@cartura/contracts/refunds";
import { useRouter } from "next/navigation";
import { type SubmitEvent, useState, useTransition } from "react";
import { toast } from "sonner";

import { requestReturnAction } from "../actions/request-return.action";

export function useReturnRequest(orderId: string) {
  const [reason, setReason] = useState<RefundReason>("damaged");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await requestReturnAction({
        orderId,
        reason,
        note: note.trim() || undefined,
      });

      if (!result.ok) {
        toast.error("Return request not submitted", {
          description: result.message,
        });
        return;
      }

      toast.success("Return request submitted");
      router.refresh();
    });
  }

  return {
    reason,
    setReason,
    note,
    setNote,
    isPending,
    submit,
  };
}
