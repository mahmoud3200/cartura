import { Router } from "express";

import { addressesRouter } from "../modules/addresses/index.js";
import { rejectRestrictedAccount } from "../modules/auth/index.js";
import { managementAnalyticsRouter } from "../modules/analytics/index.js";
import { auditLogsRouter } from "../modules/audit-logs/index.js";
import { authorizationRouter } from "../modules/authorization/index.js";
import { cartRouter } from "../modules/cart/index.js";
import {
  catalogRouter,
  managementCatalogRouter,
} from "../modules/catalog/index.js";
import { mediaRouter } from "../modules/media/index.js";
import { notificationsRouter } from "../modules/notifications/index.js";
import {
  managementOrdersRouter,
  ordersRouter,
} from "../modules/orders/index.js";
import {
  managementPaymentsRouter,
  paymentsRouter,
} from "../modules/payments/index.js";
import {
  managementRefundsRouter,
  refundsRouter,
} from "../modules/refunds/index.js";
import { usersRouter } from "../modules/users/index.js";

export const apiRouter = Router();

apiRouter.use(rejectRestrictedAccount);

apiRouter.get("/", (_req, res) => {
  res.status(200).json({
    data: {
      name: "Cartura API",
      version: "v1",
    },
  });
});

apiRouter.use("/management/authorization", authorizationRouter);
apiRouter.use("/management/analytics", managementAnalyticsRouter);
apiRouter.use("/management/audit-logs", auditLogsRouter);
apiRouter.use("/management/users", usersRouter);
apiRouter.use("/management/media", mediaRouter);
apiRouter.use("/management/orders", managementOrdersRouter);
apiRouter.use("/management/refunds", managementRefundsRouter);
apiRouter.use("/management/payments", managementPaymentsRouter);
apiRouter.use("/addresses", addressesRouter);
apiRouter.use("/catalog", catalogRouter);
apiRouter.use("/management/catalog", managementCatalogRouter);
apiRouter.use("/cart", cartRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/payments", paymentsRouter);
apiRouter.use("/refunds", refundsRouter);
apiRouter.use("/notifications", notificationsRouter);
