export const authorizationPaths = {
  "/api/v1/management/authorization/users/role-options": {
    get: {
      tags: ["Authorization"],
      summary: "List roles available for user assignment",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Assignable user role options" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
  },
  "/api/v1/management/authorization/permissions": {
    get: {
      tags: ["Authorization"],
      summary: "List permissions",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Permission list" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
  },
  "/api/v1/management/authorization/roles": {
    get: {
      tags: ["Authorization"],
      summary: "List roles",
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
      ],
      responses: {
        "200": { description: "Paginated role list" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
    post: {
      tags: ["Authorization"],
      summary: "Create a custom role",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateRoleRequest" },
          },
        },
      },
      responses: {
        "201": { description: "Role created" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
  },
  "/api/v1/management/authorization/roles/{roleId}": {
    patch: {
      tags: ["Authorization"],
      summary: "Update a custom role",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/RoleId" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateRoleRequest" },
          },
        },
      },
      responses: {
        "200": { description: "Role updated" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "Role not found" },
      },
    },
    delete: {
      tags: ["Authorization"],
      summary: "Delete a custom role",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/RoleId" }],
      responses: {
        "204": { description: "Role deleted" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "Role not found" },
      },
    },
  },
  "/api/v1/management/authorization/roles/{roleId}/permissions": {
    put: {
      tags: ["Authorization"],
      summary: "Replace custom role permissions",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/RoleId" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/UpdateRolePermissionsRequest",
            },
          },
        },
      },
      responses: {
        "204": { description: "Permissions replaced" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
        "404": { description: "Role not found" },
      },
    },
  },
  "/api/v1/management/authorization/users/{userId}/role": {
    put: {
      tags: ["Authorization"],
      summary: "Replace a user's role",
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: "#/components/parameters/UserId" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateUserRoleRequest" },
          },
        },
      },
      responses: {
        "204": { description: "Role updated" },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
  },
} as const;
