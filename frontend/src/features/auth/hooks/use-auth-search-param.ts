"use client";

import { useSearchParams } from "next/navigation";

export function useAuthSearchParam(key: string) {
  const searchParams = useSearchParams();

  return searchParams.get(key) ?? "";
}
