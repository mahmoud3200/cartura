export const addressPaths = {
  "/api/v1/addresses": {
    get: {
      tags: ["Addresses"],
      summary: "List current user's addresses",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Address list" },
        "401": { $ref: "#/components/responses/AuthError" },
      },
    },
    post: {
      tags: ["Addresses"],
      summary: "Create an address",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateAddressRequest" },
          },
        },
      },
      responses: {
        "201": { description: "Address created" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "409": { description: "Address limit exceeded" },
      },
    },
  },
  "/api/v1/addresses/{addressId}": {
    get: {
      tags: ["Addresses"],
      summary: "Get current user's address",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/AddressId" }],
      responses: {
        "200": { description: "Address" },
        "401": { $ref: "#/components/responses/AuthError" },
        "404": { description: "Address not found" },
      },
    },
    patch: {
      tags: ["Addresses"],
      summary: "Update current user's address",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/AddressId" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateAddressRequest" },
          },
        },
      },
      responses: {
        "200": { description: "Address updated" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "404": { description: "Address not found" },
      },
    },
    delete: {
      tags: ["Addresses"],
      summary: "Delete current user's address",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/AddressId" }],
      responses: {
        "204": { description: "Address deleted" },
        "401": { $ref: "#/components/responses/AuthError" },
        "404": { description: "Address not found" },
      },
    },
  },
  "/api/v1/addresses/{addressId}/default": {
    patch: {
      tags: ["Addresses"],
      summary: "Set current user's default address",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/AddressId" }],
      responses: {
        "200": { description: "Default address updated" },
        "401": { $ref: "#/components/responses/AuthError" },
        "404": { description: "Address not found" },
      },
    },
  },
} as const;

