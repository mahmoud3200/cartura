import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env, frontendOrigins } from "./config/env.js";
import { getTrustProxySetting } from "./config/rate-limit.js";
import { docsRouter } from "./docs/index.js";
import {
  authNodeHandler,
  normalizeEmailSignUpRequest,
} from "./modules/auth/index.js";
import { systemController } from "./modules/system/index.js";
import { apiRouter } from "./routes/api-router.js";
import { routeNotFoundError } from "./shared/errors/index.js";
import { errorHandler } from "./shared/middleware/error-handler.js";
import { requireInternalApiAccess } from "./shared/middleware/internal-api-auth.js";
import { notFound } from "./shared/middleware/not-found.js";
import { coarseRateLimit } from "./shared/middleware/rate-limit.js";
import { requestContext } from "./shared/middleware/request-context.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", getTrustProxySetting());

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'self'"],
          "script-src": [
            "'self'",
            "'unsafe-inline'",
            "https://cdn.jsdelivr.net",
          ],
          "style-src": [
            "'self'",
            "'unsafe-inline'",
            "https://cdn.jsdelivr.net",
          ],
          "img-src": ["'self'", "data:", "https://validator.swagger.io"],
        },
      },
    }),
  );

  app.use(
    cors({
      origin: frontendOrigins,
      credentials: true,
    }),
  );

  app.use(requestContext);

  if (env.NODE_ENV !== "development") {
    app.all(
      ["/api/v1/auth/reference", "/api/v1/auth/open-api/{*any}"],
      (req, _res, next) => {
        next(routeNotFoundError(req.method, req.originalUrl));
      },
    );
  }

  app.use("/api/v1", requireInternalApiAccess);

  app.post(
    "/api/v1/auth/sign-up/email",
    express.json({
      limit: "1mb",
    }),
    normalizeEmailSignUpRequest,
  );

  app.all("/api/v1/auth", authNodeHandler);
  app.all("/api/v1/auth/{*any}", authNodeHandler);

  app.use("/api/v1", coarseRateLimit);

  // prevents users from sending JSON bodies higher than 1mb
  app.use(
    express.json({
      limit: "1mb",
    }),
  );

  app.use(
    express.urlencoded({
      extended: false,
    }),
  );

  app.get("/health", systemController.health);
  app.use(docsRouter);

  app.use("/api/v1", apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
