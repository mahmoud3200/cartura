"use client";

import { DashboardError } from "@/features/management/shared/components/admin-ui";
import { Button } from "@/shared/ui/button";

export default function ManagementErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4">
      <DashboardError error={error} />
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
