export function getRequestOrigin(requestHeaders: Headers) {
  const origin = requestHeaders.get("origin");

  if (origin) {
    return origin;
  }

  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const host = requestHeaders.get("host");

  if (host) {
    const protocol =
      forwardedProto ?? (host.startsWith("localhost") ? "http" : "https");

    return `${protocol}://${host}`;
  }

  return (
    process.env.FRONTEND_URL ??
    process.env.NEXT_PUBLIC_FRONTEND_URL ??
    "http://localhost:3000"
  );
}
