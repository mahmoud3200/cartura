import {
  apiErrorResponseSchema,
  RATE_LIMIT_EXCEEDED_CODE,
} from "@cartura/contracts/common";

const forwardedHeaderNames = [
  "retry-after",
  "ratelimit",
  "ratelimit-policy",
  "x-ratelimit-limit",
  "x-ratelimit-remaining",
  "x-ratelimit-reset",
  "x-request-id",
] as const;

export function getRateLimitResponseMetadata(
  response: Response,
  payload: unknown,
) {
  const parsed = apiErrorResponseSchema.safeParse(payload);
  const retryAfterSeconds = parseRetryAfter(response.headers.get("retry-after"));

  return {
    code: parsed.success ? parsed.data.error.code : undefined,
    retryAfterSeconds,
    headers: pickRateLimitHeaders(response.headers),
  };
}

export function pickRateLimitHeaders(source: Headers): Headers {
  const result = new Headers();

  for (const name of forwardedHeaderNames) {
    const value = source.get(name);

    if (value) result.set(name, value);
  }

  return result;
}

export function appendRateLimitHeaders(target: Headers, source: Headers): void {
  pickRateLimitHeaders(source).forEach((value, name) => target.set(name, value));
}

export function isRateLimitCode(code: string | undefined): boolean {
  return code === RATE_LIMIT_EXCEEDED_CODE;
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;

  const seconds = Number(value);

  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);

  const date = Date.parse(value);

  if (Number.isNaN(date)) return undefined;

  return Math.max(0, Math.ceil((date - Date.now()) / 1000));
}
