const DEFAULT_API_BASE_URL = "http://localhost:4000";
const DEFAULT_TIMEOUT_MS = 180_000;
const POLL_INTERVAL_MS = 500;
const REQUEST_TIMEOUT_MS = 5_000;

const apiBaseUrl = (process.env.CARTURA_API_URL ?? DEFAULT_API_BASE_URL).replace(
  /\/+$/,
  "",
);
const healthUrl = `${apiBaseUrl}/health`;
const timeoutMs = readPositiveNumber(
  process.env.CARTURA_DEV_STARTUP_TIMEOUT_MS,
  DEFAULT_TIMEOUT_MS,
);

console.log(
  `Waiting up to ${formatSeconds(timeoutMs)} seconds for the Cartura API at ${healthUrl}...`,
);

try {
  await waitForApi(healthUrl, timeoutMs);
  console.log("Cartura API is ready. Starting the frontend...");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

async function waitForApi(url, timeout) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeout) {
    const remainingMs = timeout - (Date.now() - startedAt);

    try {
      const response = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(
          Math.max(1, Math.min(REQUEST_TIMEOUT_MS, remainingMs)),
        ),
      });

      if (response.ok) {
        const payload = await response.json();

        if (payload?.status === "ok") {
          return;
        }
      }
    } catch {
      // The backend is still booting. Retry until the overall timeout expires.
    }

    await delay(Math.min(POLL_INTERVAL_MS, remainingMs));
  }

  throw new Error(
    `Cartura API did not become ready at ${url} within ${formatSeconds(timeout)} seconds. ` +
      "Check the backend logs or adjust CARTURA_DEV_STARTUP_TIMEOUT_MS.",
  );
}

function readPositiveNumber(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(
      `CARTURA_DEV_STARTUP_TIMEOUT_MS must be a positive number; received ${JSON.stringify(value)}.`,
    );
  }

  return parsed;
}

function formatSeconds(milliseconds) {
  return milliseconds / 1_000;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
