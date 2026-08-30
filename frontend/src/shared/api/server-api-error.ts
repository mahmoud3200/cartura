export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
    public readonly code?: string,
    public readonly retryAfterSeconds?: number,
    public readonly responseHeaders: Headers = new Headers(),
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getApiErrorMessage(payload: unknown) {
  if (payload && typeof payload === "object") {
    if (
      "error" in payload &&
      payload.error &&
      typeof payload.error === "object" &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
    ) {
      return payload.error.message;
    }

    if ("message" in payload && typeof payload.message === "string") {
      return payload.message;
    }
  }

  return "The request could not be completed.";
}
