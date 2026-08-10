"use client";

import type { LucideIcon } from "lucide-react";
import { Ellipsis, LoaderCircle } from "lucide-react";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuPortal,
  DropdownMenuPositioner,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

export type ManagementTableAction = {
  label: string;
  icon?: LucideIcon;
  href?: string;
  onSelect?: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

export function ManagementTableActions({
  label,
  actions,
  isPending = false,
}: {
  label: string;
  actions: readonly ManagementTableAction[];
  isPending?: boolean;
}) {
  if (!actions.length) return <span aria-hidden="true" />;

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger
          type="button"
          aria-label={isPending ? `${label}: saving` : label}
          title={label}
          disabled={isPending}
        >
          {isPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Ellipsis className="size-4" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuPositioner align="end">
            <DropdownMenuContent>
              {actions.map((action) => {
                const Icon = action.icon;

                if (action.href) {
                  return (
                    <DropdownMenuLinkItem
                      key={action.label}
                      render={<Link href={action.href} />}
                      closeOnClick
                    >
                      {Icon ? <Icon /> : null}
                      {action.label}
                    </DropdownMenuLinkItem>
                  );
                }

                return (
                  <DropdownMenuItem
                    key={action.label}
                    disabled={action.disabled}
                    destructive={action.destructive}
                    onClick={action.onSelect}
                  >
                    {Icon ? <Icon /> : null}
                    {action.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenuPositioner>
        </DropdownMenuPortal>
      </DropdownMenu>
    </div>
  );
}
