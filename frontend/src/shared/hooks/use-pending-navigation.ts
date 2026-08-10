"use client";

import { useTransition } from "react";

export function usePendingNavigation() {
  const [isPending, startTransition] = useTransition();

  return {
    isPending,
    startTransition,
  };
}
