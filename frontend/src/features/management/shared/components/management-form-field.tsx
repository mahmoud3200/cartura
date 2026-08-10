import type { ReactNode } from "react";

import { Label } from "@/shared/ui/label";

export function ManagementFormField({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      <ManagementFieldError message={error} />
    </div>
  );
}

export function ManagementFieldError({ message }: { message?: string }) {
  return message ? (
    <p className="text-sm leading-5 text-destructive">{message}</p>
  ) : null;
}
