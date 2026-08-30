import "server-only";

import type { NextRequest } from "next/server";

import { getInternalServiceHeaders } from "@/shared/api/internal-service-auth";

const apiBaseUrl = (
  process.env.CARTURA_API_URL ?? "http://localhost:4000"
).replace(/\/$/, "");

const requestHeaderAllowlist = [
  "accept",
  "content-type",
  "cookie",
  "origin",
  "user-agent",
] as const;

const responseHeaderBlocklist = new Set([
  "connection",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

export async function proxyBetterAuthRequest(
  request: NextRequest,
  path: string[],
): Promise<Response> {
  const upstreamHeaders = new Headers();

  for (const name of requestHeaderAllowlist) {
    const value = request.headers.get(name);

    if (value) upstreamHeaders.set(name, value);
  }

  upstreamHeaders.set("origin", request.nextUrl.origin);

  for (const [name, value] of Object.entries(
    await getInternalServiceHeaders(),
  )) {
    upstreamHeaders.set(name, value);
  }

  try {
    const upstream = await fetch(
      `${apiBaseUrl}/api/v1/auth/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`,
      {
        method: request.method,
        headers: upstreamHeaders,
        body: request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.arrayBuffer(),
        redirect: "manual",
        cache: "no-store",
      },
    );
    const responseHeaders = new Headers();

    upstream.headers.forEach((value, name) => {
      if (!responseHeaderBlocklist.has(name.toLowerCase())) {
        responseHeaders.append(name, value);
      }
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Better Auth proxy failed", { path, error });

    return Response.json(
      {
        error: {
          code: "AUTH_UPSTREAM_UNAVAILABLE",
          message: "Authentication is temporarily unavailable.",
        },
      },
      { status: 502 },
    );
  }
}
