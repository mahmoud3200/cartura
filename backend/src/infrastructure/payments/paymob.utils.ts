import crypto from "node:crypto";

import { paymobConfig } from "../../config/paymob.js";

const transactionHmacKeys = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "obj.id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order.id",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
] as const;

export function calculateTransactionHmac(
  payload: unknown,
  hmacSecret: string,
): string {
  const data = normalizeCallbackPayload(payload);
  const source = transactionHmacKeys
    .map((key) => stringifyHmacValue(getNestedValue(data, key)))
    .join("");

  return crypto.createHmac("sha512", hmacSecret).update(source).digest("hex");
}

export function timingSafeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function getPaymobUrl(endpoint: string): string {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }

  return `${paymobConfig.baseUrl}/${endpoint.replace(/^\/+/, "")}`;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeCallbackPayload(payload: unknown): Record<string, unknown> {
  if (!isRecord(payload)) {
    return {};
  }

  const obj = payload.obj;

  return isRecord(obj) ? obj : payload;
}

function getNestedValue(data: Record<string, unknown>, key: string): unknown {
  const normalizedKey = key === "obj.id" ? "id" : key;

  return normalizedKey.split(".").reduce<unknown>((current, path) => {
    if (!isRecord(current)) {
      return undefined;
    }

    return current[path];
  }, data);
}

function stringifyHmacValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
}
