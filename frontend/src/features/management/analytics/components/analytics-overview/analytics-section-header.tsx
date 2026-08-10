import type { ReactNode } from "react";

import { SeeAllLink } from "@/features/management/shared/components/admin-ui";

export function AnalyticsSectionHeader({
  title,
  description,
  icon,
  seeAllHref,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  seeAllHref?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border p-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        {seeAllHref ? <SeeAllLink href={seeAllHref} /> : null}
        {icon}
      </div>
    </div>
  );
}
