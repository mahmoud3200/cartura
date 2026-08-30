export const analyticsPaths = {
  "/api/v1/management/analytics/overview": {
    get: {
      tags: ["Analytics"],
      summary: "Get management dashboard analytics overview",
      description:
        "Returns read-only operational summaries for the dashboard. Revenue is grouped by currency and is not converted.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "range",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: ["7d", "30d", "90d", "all"],
            default: "30d",
          },
        },
      ],
      responses: {
        "200": {
          description: "Analytics overview",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AnalyticsOverviewResponse" },
            },
          },
        },
        "401": { $ref: "#/components/responses/AuthError" },
        "403": { $ref: "#/components/responses/ForbiddenError" },
      },
    },
  },
} as const;

