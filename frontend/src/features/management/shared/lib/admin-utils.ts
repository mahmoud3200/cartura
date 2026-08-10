import { InternalApiError } from "@/features/management/shared/api/paginated-api";

export function getDashboardErrorMessage(error: unknown) {
  if (error instanceof InternalApiError) {
    if (error.status === 401) {
      return "Your session has expired. Sign in again to continue.";
    }

    if (error.status >= 500) {
      return error.message;
    }

    return error.message || "The request could not be completed.";
  }

  return "The page could not load right now. Please refresh and try again.";
}

export function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getStatusClass(status: string) {
  if (
    ["active", "paid", "completed", "processed", "shipped"].includes(status)
  ) {
    return "bg-accent text-accent-foreground";
  }

  if (
    [
      "failed",
      "payment_failed",
      "manual_review",
      "disabled",
      "cancelled",
    ].includes(status)
  ) {
    return "bg-destructive/10 text-destructive";
  }

  return "bg-secondary text-secondary-foreground";
}
