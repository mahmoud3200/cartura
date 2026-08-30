import { paymobConfig } from "../../config/paymob.js";
import { httpError } from "../../shared/errors/index.js";
import {
  paymobIntentionResponseSchema,
  paymobRefundResponseSchema,
  type CreatePaymobIntentionInput,
  type CreatePaymobRefundInput,
  type PaymobIntentionResponse,
  type PaymobRefundResponse,
} from "./paymob.types.js";
import {
  calculateTransactionHmac,
  getPaymobUrl,
  isRecord,
  timingSafeEqual,
} from "./paymob.utils.js";

export class PaymobClient {
  async createIntention(
    input: CreatePaymobIntentionInput,
  ): Promise<PaymobIntentionResponse> {
    if (!paymobConfig.secretKey) {
      throw httpError(
        503,
        "PAYMOB_NOT_CONFIGURED",
        "Paymob secret key is not configured",
      );
    }

    const response = await fetchPaymob(`${paymobConfig.baseUrl}/v1/intention/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${paymobConfig.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: input.amount,
        currency: input.currency,
        payment_methods: input.paymentMethods,
        items: input.items,
        billing_data: input.billingData,
        special_reference: input.specialReference,
        expiration: paymobConfig.intentionExpirationSeconds,
        notification_url: input.notificationUrl,
        redirection_url: input.redirectionUrl,
        extras: input.extras,
      }),
    }, "PAYMOB_INTENTION_UNAVAILABLE", "Paymob checkout is unavailable");

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw httpError(
        502,
        "PAYMOB_INTENTION_FAILED",
        "Paymob failed to create checkout intention",
      );
    }

    const parsed = paymobIntentionResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw httpError(
        502,
        "PAYMOB_INTENTION_RESPONSE_INVALID",
        "Paymob returned an invalid checkout response",
      );
    }

    return parsed.data;
  }

  getUnifiedCheckoutUrl(clientSecret: string): string {
    if (!paymobConfig.publicKey) {
      throw httpError(
        503,
        "PAYMOB_NOT_CONFIGURED",
        "Paymob public key is not configured",
      );
    }

    const params = new URLSearchParams({
      publicKey: paymobConfig.publicKey,
      clientSecret,
    });

    return `${paymobConfig.baseUrl}/unifiedcheckout/?${params.toString()}`;
  }

  async refundTransaction(
    input: CreatePaymobRefundInput,
  ): Promise<PaymobRefundResponse> {
    if (!paymobConfig.refundEndpoint) {
      throw httpError(
        503,
        "PAYMOB_REFUND_NOT_CONFIGURED",
        "Paymob refund endpoint is not configured",
      );
    }

    if (!paymobConfig.apiKey) {
      throw httpError(
        503,
        "PAYMOB_REFUND_NOT_CONFIGURED",
        "Paymob API key is not configured",
      );
    }

    const authToken = await this.createLegacyAuthToken();
    const response = await fetchPaymob(getPaymobUrl(paymobConfig.refundEndpoint), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_token: authToken,
        transaction_id: input.transactionId,
        amount_cents: input.amount,
      }),
    }, "PAYMOB_REFUND_UNAVAILABLE", "Paymob refund service is unavailable");
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw httpError(
        502,
        "PAYMOB_REFUND_FAILED",
        "Paymob failed to execute refund",
      );
    }

    const parsed = paymobRefundResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw httpError(
        502,
        "PAYMOB_REFUND_RESPONSE_INVALID",
        "Paymob returned an invalid refund response",
      );
    }

    return parsed.data;
  }

  verifyTransactionHmac(payload: unknown, receivedHmac: string | undefined) {
    if (!paymobConfig.hmacSecret) {
      throw httpError(
        503,
        "PAYMOB_NOT_CONFIGURED",
        "Paymob HMAC secret is not configured",
      );
    }

    if (!receivedHmac) {
      throw httpError(400, "PAYMOB_HMAC_MISSING", "Missing Paymob HMAC");
    }

    const calculated = calculateTransactionHmac(payload, paymobConfig.hmacSecret);

    if (!timingSafeEqual(calculated, receivedHmac)) {
      throw httpError(400, "PAYMOB_HMAC_INVALID", "Invalid Paymob HMAC");
    }
  }

  private async createLegacyAuthToken(): Promise<string> {
    const response = await fetchPaymob(`${paymobConfig.baseUrl}/api/auth/tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: paymobConfig.apiKey,
      }),
    }, "PAYMOB_AUTH_UNAVAILABLE", "Paymob authentication is unavailable");
    const payload = await response.json().catch(() => null);

    const token = isRecord(payload) ? payload.token : null;

    if (!response.ok || typeof token !== "string") {
      throw httpError(
        502,
        "PAYMOB_AUTH_FAILED",
        "Paymob failed to create an API auth token",
      );
    }

    return token;
  }
}

export const paymobClient = new PaymobClient();

const PAYMOB_REQUEST_TIMEOUT_MS = 15_000;

async function fetchPaymob(
  url: string,
  init: RequestInit,
  code: string,
  message: string,
): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(PAYMOB_REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw httpError(502, code, message);
  }
}
