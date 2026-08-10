import type { Notification } from "@cartura/contracts/notifications";
import {
  BadgeCheck,
  CircleAlert,
  Clock3,
  CreditCard,
  PackageCheck,
  PackageOpen,
  Truck,
  type LucideIcon,
} from "lucide-react";

type NotificationDisplay = {
  icon: LucideIcon;
  href: string | null;
};

export function getNotificationDisplay(
  notification: Notification,
): NotificationDisplay {
  const orderId = getNotificationDataString(notification.data, "orderId");

  return {
    icon: getNotificationIcon(notification.type),
    href: orderId
      ? `/settings/orders/${encodeURIComponent(orderId)}`
      : null,
  };
}

export function formatNotificationTime(value: string): string {
  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return "";
  }

  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(seconds) < 60) {
    return formatter.format(seconds, "second");
  }

  const minutes = Math.round(seconds / 60);

  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, "minute");
  }

  const hours = Math.round(minutes / 60);

  if (Math.abs(hours) < 24) {
    return formatter.format(hours, "hour");
  }

  const days = Math.round(hours / 24);

  if (Math.abs(days) < 30) {
    return formatter.format(days, "day");
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(timestamp);
}

function getNotificationIcon(type: string): LucideIcon {
  if (type === "order.placed" || type === "order.created") {
    return PackageOpen;
  }

  if (type === "order.processing") {
    return Clock3;
  }

  if (type === "order.shipped") {
    return Truck;
  }

  if (type === "order.completed") {
    return PackageCheck;
  }

  if (type === "payment.paid") {
    return CreditCard;
  }

  if (
    type === "payment.failed" ||
    type === "order.cancelled" ||
    type === "order.expired"
  ) {
    return CircleAlert;
  }

  return BadgeCheck;
}

function getNotificationDataString(
  data: Notification["data"],
  key: string,
): string | null {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    !(key in data)
  ) {
    return null;
  }

  const value = data[key];

  return typeof value === "string" ? value : null;
}
