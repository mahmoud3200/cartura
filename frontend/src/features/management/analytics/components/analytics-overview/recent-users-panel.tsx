import { Users } from "lucide-react";

import type { AnalyticsOverviewResponse } from "@cartura/contracts/analytics";

import {
  EmptyState,
  StatusBadge,
} from "@/features/management/shared/components/admin-ui";
import { AnalyticsSectionHeader } from "./analytics-section-header";

export function RecentUsersPanel({
  overview,
}: {
  overview: AnalyticsOverviewResponse;
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <AnalyticsSectionHeader
        title="Recent users"
        description="Newest customer accounts across the store"
        icon={<Users className="size-5 text-muted-foreground" />}
        seeAllHref="/dashboard/users"
      />
      <div className="divide-y divide-border">
        {overview.recent.users.length > 0 ? (
          overview.recent.users.map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-4">
              <div className="grid size-10 place-items-center rounded-md bg-foreground text-sm font-semibold text-background">
                {`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <StatusBadge status={user.accountStatus} />
            </div>
          ))
        ) : (
          <div className="p-4">
            <EmptyState label="No users yet" />
          </div>
        )}
      </div>
    </div>
  );
}
