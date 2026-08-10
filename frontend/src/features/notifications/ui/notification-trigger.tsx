import { Bell } from "lucide-react";

import { PopoverTrigger } from "@/shared/ui/popover";

export function NotificationTrigger({
  unreadCount,
}: {
  unreadCount: number;
}) {
  return (
    <PopoverTrigger
      aria-label="Notifications"
      className="relative border-0 bg-transparent"
    >
      <Bell className="size-4" />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </PopoverTrigger>
  );
}
