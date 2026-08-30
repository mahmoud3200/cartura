import "server-only";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { ZodType } from "zod";

import {
  ApiError,
  serverApiFetch,
  serverApiFormDataFetch,
} from "@/shared/api/server-api";

export async function proxyManagementGet(
  request: NextRequest,
  backendPath: string,
  options: { withAuth?: boolean; responseSchema?: ZodType } = {},
) {
  const query = request.nextUrl.searchParams.toString();
  const path = query ? `${backendPath}?${query}` : backendPath;

  return proxyRequest(
    path,
    {
      method: "GET",
      forwardCookies: true,
      withAuth: options.withAuth ?? true,
    },
    200,
    options.responseSchema,
  );
}

export async function proxyManagementFormDataPost(
  request: NextRequest,
  backendPath: string,
  responseSchema: ZodType,
) {
  const formData = await request.formData();

  return proxyFormDataRequest(
    backendPath,
    {
      method: "POST",
      formData,
      forwardCookies: true,
    },
    201,
    responseSchema,
  );
}

async function proxyRequest(
  path: string,
  init: Parameters<typeof serverApiFetch>[1],
  successStatus = 200,
  responseSchema?: ZodType,
) {
  try {
    const payload = await serverApiFetch<unknown>(path, init);

    if (successStatus === 204) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(
      responseSchema ? responseSchema.parse(payload) : payload,
      { status: successStatus },
    );
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
          message: "The request could not be completed.",
        },
      },
      { status: 500 },
    );
  }
}

async function proxyFormDataRequest(
  path: string,
  init: Parameters<typeof serverApiFormDataFetch>[1],
  successStatus = 200,
  responseSchema?: ZodType,
) {
  try {
    const payload = await serverApiFormDataFetch<unknown>(path, init);

    return NextResponse.json(
      responseSchema ? responseSchema.parse(payload) : payload,
      { status: successStatus },
    );
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
          message: "The request could not be completed.",
        },
      },
      { status: 500 },
    );
  }
}
