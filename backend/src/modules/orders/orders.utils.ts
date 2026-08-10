import { paymobConfig } from "../../config/paymob.js";

export function createOrderNumber(): string {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CT-${Date.now()}-${random}`;
}

export function getCheckoutExpiresAt(): Date {
  return new Date(Date.now() + paymobConfig.intentionExpirationSeconds * 1000);
}

export function toMinorUnits(value: unknown): number {
  return Math.round(Number(value) * 100);
}

export function getStringFromJson(value: unknown, key: string): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const result = (value as Record<string, unknown>)[key];
  return typeof result === "string" ? result : null;
}

export function getDateFromJson(value: unknown, key: string): Date | null {
  const raw = getStringFromJson(value, key);
  const date = raw ? new Date(raw) : null;
  return date && Number.isFinite(date.getTime()) ? date : null;
}
