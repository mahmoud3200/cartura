import { ORDER_CURRENCY } from "@cartura/contracts/orders";

import { env } from "./env.js";

export const paymobConfig = {
  baseUrl: env.PAYMOB_BASE_URL.replace(/\/$/, ""),
  apiKey: env.PAYMOB_API_KEY,
  secretKey: env.PAYMOB_SECRET_KEY,
  publicKey: env.PAYMOB_PUBLIC_KEY,
  hmacSecret: env.PAYMOB_HMAC_SECRET,
  webhookUrl: env.PAYMOB_WEBHOOK_URL,
  redirectionUrl: env.PAYMOB_REDIRECTION_URL,
  intentionExpirationSeconds: env.PAYMOB_INTENTION_EXPIRATION_SECONDS,
  refundEndpoint: env.PAYMOB_REFUND_ENDPOINT,
};

export function getPaymobCardIntegrationId(currency: string): number | null {
  if (currency.toUpperCase() !== ORDER_CURRENCY) {
    return null;
  }

  const rawIntegrationId = env.PAYMOB_CARD_INTEGRATION_ID;
  const integrationId = Number(rawIntegrationId);

  return Number.isInteger(integrationId) && integrationId > 0
    ? integrationId
    : null;
}

export function isPaymobCheckoutConfigured(currency: string): boolean {
  return getPaymobCheckoutConfigurationIssue(currency) === null;
}

export function getPaymobCheckoutConfigurationIssue(
  currency: string,
): { code: string; message: string } | null {
  if (!paymobConfig.secretKey || !paymobConfig.publicKey) {
    return {
      code: "PAYMOB_NOT_CONFIGURED",
      message: "Paymob secret and public keys are required",
    };
  }

  if (!paymobConfig.hmacSecret) {
    return {
      code: "PAYMOB_HMAC_NOT_CONFIGURED",
      message: "Paymob HMAC verification is required before checkout",
    };
  }

  if (!paymobConfig.webhookUrl) {
    return {
      code: "PAYMOB_WEBHOOK_NOT_CONFIGURED",
      message: "A Paymob transaction processed callback URL is required",
    };
  }

  if (!isPublicCallbackUrl(paymobConfig.webhookUrl)) {
    return {
      code: "PAYMOB_WEBHOOK_NOT_PUBLIC",
      message:
        "Paymob cannot reach a localhost callback. Configure a public HTTPS webhook URL or a development tunnel",
    };
  }

  if (!getPaymobCardIntegrationId(currency)) {
    return {
      code: "PAYMOB_INTEGRATION_NOT_CONFIGURED",
      message: `Paymob card integration is not configured for ${currency}`,
    };
  }

  return null;
}

function isPublicCallbackUrl(value: string) {
  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();

  return (
    url.protocol === "https:" &&
    hostname !== "localhost" &&
    hostname !== "0.0.0.0" &&
    hostname !== "::1" &&
    !hostname.startsWith("127.") &&
    !hostname.endsWith(".local")
  );
}
