"use client";

import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/shared/ui/button";

type SubmitButtonProps = {
  children: ReactNode;
  pendingLabel?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  className?: string;
};

export function SubmitButton({
  children,
  pendingLabel = "Working...",
  variant,
  className,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className={`h-10 w-full rounded-md ${className ?? ""}`}
      disabled={pending}
      variant={variant}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
