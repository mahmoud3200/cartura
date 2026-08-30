import "server-only";

import { NextResponse } from "next/server";

import { ApiError } from "@/shared/api/server-api";

export async function notificationRouteResponse<T>(
  operation: () => Promise<T>,
) {
  try {
    return NextResponse.json(await operation());
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(error.payload, {
        status: error.status,
        headers: error.responseHeaders,
      });
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Notifications could not be updated.",
        },
      },
      { status: 500 },
    );
  }
}
