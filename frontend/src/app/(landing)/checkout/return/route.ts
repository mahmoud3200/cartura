import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const destination = new URL("/checkout/result", request.url);

  for (const [key, value] of request.nextUrl.searchParams.entries()) {
    destination.searchParams.append(key, value);
  }

  return NextResponse.redirect(destination);
}
