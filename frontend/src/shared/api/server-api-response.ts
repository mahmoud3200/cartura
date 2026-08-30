import { ApiError, getApiErrorMessage } from "./server-api-error";
import { getRateLimitResponseMetadata } from "./rate-limit-headers";

export async function readApiResponse<T>(response: Response): Promise<T> {
  const payload = await readPayload(response);

  if (!response.ok) {
    const metadata = getRateLimitResponseMetadata(response, payload);

    throw new ApiError(
      getApiErrorMessage(payload),
      response.status,
      payload,
      metadata.code,
      metadata.retryAfterSeconds,
      metadata.headers,
    );
  }

  return payload as T;
}

async function readPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    const text = await response.text();
    return text || null;
  }

  return response.json();
}
