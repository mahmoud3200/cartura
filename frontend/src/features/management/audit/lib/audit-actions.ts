export type AuditActionOption = {
  label: string;
  value: string;
};

export type AuditResourceOption = {
  actions: readonly AuditActionOption[];
  label: string;
  value: string;
};

export const auditResourceOptions: readonly AuditResourceOption[] = [
  {
    label: "Products",
    value: "product",
    actions: [
      { label: "Create", value: "product.create" },
      { label: "Update", value: "product.update" },
      { label: "Update inventory", value: "product.inventory.update" },
      { label: "Delete", value: "product.soft_delete" },
    ],
  },
  {
    label: "Categories",
    value: "category",
    actions: [
      { label: "Create", value: "category.create" },
      { label: "Update", value: "category.update" },
      { label: "Delete", value: "category.soft_delete" },
    ],
  },
  {
    label: "Orders",
    value: "order",
    actions: [
      { label: "Update status", value: "order.status.update" },
      { label: "Expire", value: "order.expired" },
    ],
  },
  {
    label: "Payment webhooks",
    value: "payment_webhook_event",
    actions: [
      { label: "Reprocess", value: "payment.webhook.reprocess" },
      { label: "Send to manual review", value: "payment.webhook.manual_review" },
    ],
  },
  {
    label: "Refunds",
    value: "refund",
    actions: [
      { label: "Request", value: "refund.request" },
      { label: "Execute", value: "refund.execute" },
      { label: "Execution failed", value: "refund.execute.failed" },
    ],
  },
  {
    label: "Roles",
    value: "role",
    actions: [
      { label: "Create", value: "role.create" },
      { label: "Update", value: "role.update" },
      { label: "Replace permissions", value: "role.permissions.replace" },
      { label: "Delete", value: "role.delete" },
    ],
  },
  {
    label: "Users",
    value: "user",
    actions: [
      { label: "Update status", value: "user.status.update" },
      { label: "Assign role", value: "user_role.assign" },
      { label: "Remove role", value: "user_role.remove" },
    ],
  },
];

export const auditActorTypeOptions = [
  { label: "Customers", value: "customer" },
  { label: "Users", value: "user" },
  { label: "Staff", value: "staff" },
  { label: "System", value: "system" },
  { label: "Providers", value: "provider" },
] as const;

const auditActionOptions = auditResourceOptions.flatMap(
  (resource) => resource.actions,
);

export function getAuditActionsForResource(resourceType?: string) {
  return (
    auditResourceOptions.find((resource) => resource.value === resourceType)
      ?.actions ?? []
  );
}

export function isAuditActionForResource(
  resourceType?: string,
  action?: string,
) {
  if (!resourceType || !action) return false;

  return getAuditActionsForResource(resourceType).some(
    (option) => option.value === action,
  );
}

export function formatAuditAction(action: string) {
  return (
    auditActionOptions.find((option) => option.value === action)?.label ??
    action.replaceAll(".", " ").replaceAll("_", " ")
  );
}

export function getAuditActionClass(action: string) {
  const normalized = action.toLowerCase();

  if (
    normalized.includes("delete") ||
    normalized.includes("remove") ||
    normalized.includes("failed") ||
    normalized.includes("disable") ||
    normalized.includes("cancel")
  ) {
    return "bg-red-500/12 text-red-700 dark:text-red-300";
  }

  if (
    normalized.includes("create") ||
    normalized.includes("add") ||
    normalized.includes("assign") ||
    normalized.includes("request")
  ) {
    return "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300";
  }

  if (
    normalized.includes("update") ||
    normalized.includes("replace") ||
    normalized.includes("reprocess") ||
    normalized.includes("manual_review") ||
    normalized.includes("expired")
  ) {
    return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
  }

  if (
    normalized.includes("execute") ||
    normalized.includes("complete") ||
    normalized.includes("activate")
  ) {
    return "bg-sky-500/12 text-sky-700 dark:text-sky-300";
  }

  return "bg-muted text-muted-foreground";
}
