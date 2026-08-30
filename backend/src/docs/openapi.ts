import { addressPaths } from "./openapi/addresses.paths.js";
import { analyticsPaths } from "./openapi/analytics.paths.js";
import { auditLogPaths } from "./openapi/audit-logs.paths.js";
import { authPaths, devOnlyAuthPaths } from "./openapi/auth.paths.js";
import { authorizationPaths } from "./openapi/authorization.paths.js";
import { cartPaths } from "./openapi/cart.paths.js";
import { catalogPaths } from "./openapi/catalog.paths.js";
import { mediaPaths } from "./openapi/media.paths.js";
import { notificationPaths } from "./openapi/notifications.paths.js";
import { orderPaths } from "./openapi/orders.paths.js";
import { paymentPaths } from "./openapi/payments.paths.js";
import { refundPaths } from "./openapi/refunds.paths.js";
import { userManagementPaths } from "./openapi/users.paths.js";
import { openApiComponents } from "./openapi/components.js";

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Cartura API",
    version: "0.1.0",
    description:
      "Backend API documentation for Cartura. Authentication is powered by Better Auth.",
  },
  tags: [
    {
      name: "System",
      description: "System and health endpoints",
    },
    {
      name: "Auth",
      description: "Better Auth endpoints.",
    },
    {
      name: "Authorization",
      description: "Role and permission management endpoints.",
    },
    {
      name: "Analytics",
      description: "Protected operational dashboard analytics endpoints.",
    },
    {
      name: "Audit Logs",
      description: "Administrative audit log endpoints.",
    },
    {
      name: "User Management",
      description: "Protected user account management endpoints.",
    },
    {
      name: "Addresses",
      description: "Authenticated customer address endpoints.",
    },
    {
      name: "Catalog",
      description: "Public storefront catalog endpoints.",
    },
    {
      name: "Catalog Management",
      description: "Protected catalog management endpoints.",
    },
    {
      name: "Media Management",
      description: "Protected image upload and media asset endpoints.",
    },
    {
      name: "Cart",
      description: "Authenticated customer cart endpoints.",
    },
    {
      name: "Orders",
      description: "Authenticated customer order and checkout endpoints.",
    },
    {
      name: "Order Management",
      description: "Protected administrative order endpoints.",
    },
    {
      name: "Payments",
      description: "Customer payment and provider webhook endpoints.",
    },
    {
      name: "Payment Management",
      description: "Protected payment webhook recovery endpoints.",
    },
    {
      name: "Refund Management",
      description: "Protected return review, receipt, and refund execution endpoints.",
    },
    {
      name: "Refunds",
      description: "Authenticated customer return request endpoints.",
    },
    {
      name: "Notifications",
      description: "Authenticated user notification endpoints.",
    },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        responses: {
          "200": {
            description: "API is healthy",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1": {
      get: {
        tags: ["System"],
        summary: "API metadata",
        responses: {
          "200": {
            description: "API metadata",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiInfoResponse" },
              },
            },
          },
        },
      },
    },
    ...authPaths,
    ...devOnlyAuthPaths,
    ...analyticsPaths,
    ...authorizationPaths,
    ...auditLogPaths,
    ...userManagementPaths,
    ...addressPaths,
    ...mediaPaths,
    ...catalogPaths,
    ...cartPaths,
    ...orderPaths,
    ...paymentPaths,
    ...refundPaths,
    ...notificationPaths,
  },
  components: openApiComponents,
} as const;
