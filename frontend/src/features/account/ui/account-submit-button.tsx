"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/shared/ui/button";

export function AccountSubmitButton({
  children,
  pendingLabel,
  variant,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  variant?: "default" | "outline" | "destructive";
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} disabled={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
