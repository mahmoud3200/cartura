export const paymentPaths = {
  "/api/v1/payments/{paymentId}": {
    get: {
      tags: ["Payments"],
      summary: "Get current user's payment",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/PaymentId" }],
      responses: {
        "200": { description: "Payment" },
        "401": { $ref: "#/components/responses/AuthError" },
        "404": { description: "Payment not found" },
      },
    },
  },
  "/api/v1/payments/paymob/webhook": {
    post: {
      tags: ["Payments"],
      summary: "Paymob transaction webhook",
      description:
        "Receives Paymob transaction callbacks. The hmac query parameter is verified before processing.",
      parameters: [
        {
          name: "hmac",
          in: "query",
          required: false,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: true,
          },
        },
      },
      responses: {
        "200": { description: "Webhook accepted" },
        "400": { description: "Missing or invalid HMAC" },
        "503": { description: "Paymob HMAC secret is not configured" },
      },
    },
  },
  "/api/v1/management/payments/webhook-events": {
    get: {
      tags: ["Payment Management"],
      summary: "List payment webhook events",
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
        { name: "status", in: "query", schema: { type: "string" } },
        { name: "provider", in: "query", schema: { type: "string" } },
        { name: "paymentId", in: "query", schema: { type: "string", format: "uuid" } },
      ],
      responses: {
        "200": { description: "Webhook event list" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
  },
  "/api/v1/management/payments/webhook-events/{eventId}": {
    get: {
      tags: ["Payment Management"],
      summary: "Get payment webhook event",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/WebhookEventId" }],
      responses: {
        "200": { description: "Webhook event" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "Webhook event not found" },
      },
    },
  },
  "/api/v1/management/payments/webhook-events/{eventId}/reprocess": {
    post: {
      tags: ["Payment Management"],
      summary: "Reprocess a payment webhook event",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/WebhookEventId" }],
      responses: {
        "200": { description: "Webhook event reprocessed" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "Webhook event not found" },
        "409": { description: "Webhook event already processed" },
      },
    },
  },
} as const;

