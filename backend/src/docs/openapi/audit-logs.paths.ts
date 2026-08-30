export const auditLogPaths = {
  "/api/v1/management/audit-logs": {
    get: {
      tags: ["Audit Logs"],
      summary: "List administrative audit logs",
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
        {
          name: "actorUserId",
          in: "query",
          schema: { type: "string", format: "uuid" },
        },
        { name: "actorType", in: "query", schema: { type: "string" } },
        { name: "action", in: "query", schema: { type: "string" } },
        { name: "resourceType", in: "query", schema: { type: "string" } },
        { name: "resourceId", in: "query", schema: { type: "string" } },
        {
          name: "from",
          in: "query",
          schema: { type: "string", format: "date-time" },
        },
        {
          name: "to",
          in: "query",
          schema: { type: "string", format: "date-time" },
        },
      ],
      responses: {
        "200": {
          description: "Paginated audit log list",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuditLogListResponse" },
            },
          },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
  },
} as const;
