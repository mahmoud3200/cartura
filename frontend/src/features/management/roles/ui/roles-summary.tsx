import { formatNumber } from "@/features/management/shared/lib/admin-utils";

export function RolesSummary({
  totalRoles,
  query,
}: {
  totalRoles: number;
  query?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-lg font-semibold">Roles</h2>
      <p className="text-sm text-muted-foreground">
        {formatNumber(totalRoles)} {query ? "matching" : "total"} roles
      </p>
    </div>
  );
}
