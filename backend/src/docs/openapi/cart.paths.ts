export const cartPaths = {
  "/api/v1/cart": {
    get: {
      tags: ["Cart"],
      summary: "Get current user's cart",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Current cart" },
        "401": { $ref: "#/components/responses/AuthError" },
      },
    },
    delete: {
      tags: ["Cart"],
      summary: "Clear current user's cart",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Cart cleared" },
        "401": { $ref: "#/components/responses/AuthError" },
      },
    },
  },
  "/api/v1/cart/items": {
    post: {
      tags: ["Cart"],
      summary: "Add item to cart",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AddCartItemRequest" },
          },
        },
      },
      responses: {
        "200": { description: "Cart updated" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "409": { description: "Product unavailable or insufficient stock" },
      },
    },
  },
  "/api/v1/cart/items/{productId}": {
    patch: {
      tags: ["Cart"],
      summary: "Update cart item quantity",
      description: "Set quantity to 0 to remove the item from the cart.",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/ProductId" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateCartItemRequest" },
          },
        },
      },
      responses: {
        "200": { description: "Cart updated" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "404": { description: "Cart item not found" },
        "409": { description: "Product unavailable or insufficient stock" },
      },
    },
    delete: {
      tags: ["Cart"],
      summary: "Remove item from cart",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/ProductId" }],
      responses: {
        "200": { description: "Cart updated" },
        "401": { $ref: "#/components/responses/AuthError" },
        "404": { description: "Cart item not found" },
      },
    },
  },
} as const;

