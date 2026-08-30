type ResponseCookieOptions = {
  path?: string;
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
};

type ResponseCookieWriter = {
  set(
    name: string,
    value: string,
    options: ResponseCookieOptions,
  ): unknown;
};

export function forwardResponseCookies(
  response: Response,
  cookieStore: ResponseCookieWriter,
) {
  for (const setCookieHeader of getSetCookieHeaders(response)) {
    const parsed = parseSetCookie(setCookieHeader);

    if (parsed) {
      cookieStore.set(parsed.name, parsed.value, parsed.options);
    }
  }
}

export function getSetCookieHeaders(response: Response) {
  const headersWithGetSetCookie = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  const setCookieHeaders = headersWithGetSetCookie.getSetCookie?.();

  if (setCookieHeaders?.length) {
    return setCookieHeaders;
  }

  const setCookieHeader = response.headers.get("set-cookie");

  return setCookieHeader ? splitSetCookieHeader(setCookieHeader) : [];
}

export function splitSetCookieHeader(header: string) {
  return header.split(/,(?=\s*[^;,\s]+=)/);
}

export function parseSetCookie(header: string) {
  const [nameValue, ...attributes] = header
    .split(";")
    .map((part) => part.trim());
  const separatorIndex = nameValue.indexOf("=");

  if (separatorIndex <= 0) {
    return null;
  }

  const name = nameValue.slice(0, separatorIndex);
  const value = nameValue.slice(separatorIndex + 1);
  const options: ResponseCookieOptions = {};

  for (const attribute of attributes) {
    const [rawKey, ...rawValueParts] = attribute.split("=");
    const key = rawKey.toLowerCase();
    const attributeValue = rawValueParts.join("=").trim();

    if (key === "path" && attributeValue) {
      options.path = attributeValue;
    }

    if (key === "max-age" && attributeValue) {
      const maxAge = Number(attributeValue);

      if (Number.isFinite(maxAge)) {
        options.maxAge = maxAge;
      }
    }

    if (key === "expires" && attributeValue) {
      const expires = new Date(attributeValue);

      if (!Number.isNaN(expires.getTime())) {
        options.expires = expires;
      }
    }

    if (key === "httponly") {
      options.httpOnly = true;
    }

    if (key === "secure") {
      options.secure = true;
    }

    if (key === "samesite" && attributeValue) {
      const sameSite = attributeValue.toLowerCase();

      if (sameSite === "lax" || sameSite === "strict" || sameSite === "none") {
        options.sameSite = sameSite;
      }
    }
  }

  return {
    name,
    value,
    options,
  };
}
