"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type ToastableActionState = {
  ok: boolean;
  message?: string;
};

type UseActionToastOptions = {
  successTitle?: string;
  errorTitle?: string;
};

export function useActionToast(
  state: ToastableActionState,
  options: UseActionToastOptions = {},
) {
  const previousStateRef = useRef<ToastableActionState | null>(null);

  useEffect(() => {
    if (!state.message || previousStateRef.current === state) {
      previousStateRef.current = state;
      return;
    }

    previousStateRef.current = state;

    if (state.ok) {
      toast.success(options.successTitle ?? state.message, {
        description: options.successTitle ? state.message : undefined,
      });
      return;
    }

    toast.error(options.errorTitle ?? state.message, {
      description: options.errorTitle ? state.message : undefined,
    });
  }, [options.errorTitle, options.successTitle, state]);
}
