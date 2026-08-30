export const orderPaths = {
  "/api/v1/orders/checkout": {
    post: {
      tags: ["Orders"],
      summary: "Create an order checkout session",
      description:
        "Creates an order from the current cart. Card payments return a Paymob checkout URL; cash-on-delivery orders return a null checkout URL.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CheckoutOrderRequest" },
          },
        },
      },
      responses: {
        "201": { description: "Checkout session created" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "409": { description: "Cart empty, product unavailable, or insufficient stock" },
        "503": { description: "Paymob is not configured for the requested currency" },
      },
    },
  },
  "/api/v1/orders/buy-now": {
    post: {
      tags: ["Orders"],
      summary: "Create an order for one product",
      description:
        "Creates an immediate order for one product. Card payments return a Paymob checkout URL; cash-on-delivery orders return a null checkout URL.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/BuyNowCheckoutRequest" },
          },
        },
      },
      responses: {
        "201": { description: "Order created" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "404": { description: "Address or product not found" },
        "409": { description: "Product unavailable or insufficient stock" },
        "503": { description: "Paymob is not configured for the requested currency" },
      },
    },
  },
  "/api/v1/orders": {
    get: {
      tags: ["Orders"],
      summary: "List current user's orders",
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
        { name: "status", in: "query", schema: { type: "string" } },
        {
          name: "paymentMethod",
          in: "query",
          schema: {
            type: "string",
            enum: ["card", "cash_on_delivery"],
          },
        },
        { name: "q", in: "query", schema: { type: "string" } },
      ],
      responses: {
        "200": { description: "Order list" },
        "401": { $ref: "#/components/responses/AuthError" },
      },
    },
  },
  "/api/v1/orders/{orderId}": {
    get: {
      tags: ["Orders"],
      summary: "Get current user's order",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/OrderId" }],
      responses: {
        "200": { description: "Order" },
        "401": { $ref: "#/components/responses/AuthError" },
        "404": { description: "Order not found" },
      },
    },
  },
  "/api/v1/management/orders": {
    get: {
      tags: ["Order Management"],
      summary: "List all orders",
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
        { name: "status", in: "query", schema: { type: "string" } },
        {
          name: "paymentMethod",
          in: "query",
          schema: {
            type: "string",
            enum: ["card", "cash_on_delivery"],
          },
        },
        { name: "q", in: "query", schema: { type: "string" } },
      ],
      responses: {
        "200": { description: "Order list" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
  },
  "/api/v1/management/orders/{orderId}": {
    get: {
      tags: ["Order Management"],
      summary: "Get order by ID",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/OrderId" }],
      responses: {
        "200": { description: "Order" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "Order not found" },
      },
    },
  },
  "/api/v1/management/orders/{orderId}/status": {
    patch: {
      tags: ["Order Management"],
      summary: "Update order status",
      description:
        "Updates status using the backend order transition guard and records status history/audit logs.",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/OrderId" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateOrderStatusRequest" },
          },
        },
      },
      responses: {
        "200": { description: "Order status updated" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "409": { description: "Invalid status transition" },
      },
    },
  },
} as const;

