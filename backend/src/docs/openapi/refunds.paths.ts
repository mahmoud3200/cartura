export const refundPaths = {
  "/api/v1/refunds": {
    get: {
      tags: ["Refunds"],
      summary: "List the current customer's return requests",
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
        { name: "status", in: "query", schema: { type: "string" } },
        { name: "orderId", in: "query", schema: { type: "string", format: "uuid" } },
      ],
      responses: {
        "200": { description: "Customer return list" },
        "401": { $ref: "#/components/responses/AuthError" },
      },
    },
    post: {
      tags: ["Refunds"],
      summary: "Request a return within 14 days of completed delivery",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateRefundRequest" },
          },
        },
      },
      responses: {
        "201": { description: "Return requested" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "404": { description: "Order not found" },
        "409": { description: "Order is outside the return window or already has a return" },
      },
    },
  },
  "/api/v1/management/refunds": {
    get: {
      tags: ["Refund Management"],
      summary: "List refunds",
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
        { name: "status", in: "query", schema: { type: "string" } },
        { name: "paymentId", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "orderId", in: "query", schema: { type: "string", format: "uuid" } },
      ],
      responses: {
        "200": { description: "Refund list" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
  },
  "/api/v1/management/refunds/{refundId}/review": {
    post: {
      tags: ["Refund Management"],
      summary: "Approve or reject a return request",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/RefundId" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ReviewRefundRequest" },
          },
        },
      },
      responses: {
        "200": { description: "Return reviewed" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "Return request not found" },
        "409": { description: "Return request was already reviewed" },
      },
    },
  },
  "/api/v1/management/refunds/{refundId}/item-received": {
    post: {
      tags: ["Refund Management"],
      summary: "Confirm picked-up items were received and restock them",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/RefundId" }],
      requestBody: {
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ConfirmRefundItemReceivedRequest" },
          },
        },
      },
      responses: {
        "200": { description: "Returned items received and restocked" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "Return request not found" },
        "409": { description: "Return is not waiting for item receipt" },
      },
    },
  },
  "/api/v1/management/refunds/{refundId}/execute": {
    post: {
      tags: ["Refund Management"],
      summary: "Issue an approved refund through the original payment method",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/RefundId" }],
      responses: {
        "200": { description: "Refund execution result" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "Refund not found" },
        "409": { description: "Refund cannot be executed" },
        "503": { description: "Paymob refund endpoint/API key is not configured" },
      },
    },
  },
} as const;

