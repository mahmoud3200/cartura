"use client";

import { useEffect, type RefObject } from "react";

export function useFocusFirstFieldError(
  formRef: RefObject<HTMLFormElement | null>,
  fieldErrors?: Record<string, string[] | undefined>,
) {
  useEffect(() => {
    if (!fieldErrors || Object.keys(fieldErrors).length === 0) {
      return;
    }

    const frameId = requestAnimationFrame(() => {
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
    });

    return () => cancelAnimationFrame(frameId);
  }, [fieldErrors, formRef]);
}
