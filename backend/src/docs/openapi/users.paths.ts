export const userManagementPaths = {
  "/api/v1/management/users": {
    get: {
      tags: ["User Management"],
      summary: "List users",
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
        { name: "q", in: "query", schema: { type: "string" } },
        {
          name: "accountStatus",
          in: "query",
          schema: { $ref: "#/components/schemas/UserAccountStatus" },
        },
        {
          name: "emailVerified",
          in: "query",
          schema: { type: "boolean" },
        },
      ],
      responses: {
        "200": { description: "Paginated user list" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
  },
  "/api/v1/management/users/{userId}": {
    get: {
      tags: ["User Management"],
      summary: "Get user by ID",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/UserId" }],
      responses: {
        "200": { description: "User" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "User not found" },
      },
    },
  },
  "/api/v1/management/users/{userId}/status": {
    patch: {
      tags: ["User Management"],
      summary: "Update user account status",
      description:
        "Suspended and disabled accounts require a statusReason. Suspended accounts also require a future suspendedUntil timestamp. Setting a user active clears the reason and suspension expiry.",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/UserId" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateUserStatusRequest" },
          },
        },
      },
      responses: {
        "200": { description: "User status updated" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "User not found" },
      },
    },
  },
} as const;

