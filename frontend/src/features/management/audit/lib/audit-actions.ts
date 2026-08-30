import {
  AUDIT_ACTIONS,
  AUDIT_ACTOR_TYPES,
  AUDIT_RESOURCE_TYPES,
  type AuditAction,
  type AuditResourceType,
} from "@cartura/contracts/audit-logs";

export type AuditActionOption = {
  label: string;
  value: AuditAction;
};

export type AuditResourceOption = {
  actions: readonly AuditActionOption[];
  label: string;
  value: AuditResourceType;
};

export const auditResourceOptions: readonly AuditResourceOption[] = [
  {
    label: "Products",
    value: AUDIT_RESOURCE_TYPES.PRODUCT,
    actions: [
      { label: "Create", value: AUDIT_ACTIONS.PRODUCT_CREATE },
      { label: "Update", value: AUDIT_ACTIONS.PRODUCT_UPDATE },
      { label: "Update inventory", value: AUDIT_ACTIONS.PRODUCT_INVENTORY_UPDATE },
      { label: "Delete", value: AUDIT_ACTIONS.PRODUCT_SOFT_DELETE },
    ],
  },
  {
    label: "Categories",
    value: AUDIT_RESOURCE_TYPES.CATEGORY,
    actions: [
      { label: "Create", value: AUDIT_ACTIONS.CATEGORY_CREATE },
      { label: "Update", value: AUDIT_ACTIONS.CATEGORY_UPDATE },
      { label: "Delete", value: AUDIT_ACTIONS.CATEGORY_SOFT_DELETE },
    ],
  },
  {
    label: "Orders",
    value: AUDIT_RESOURCE_TYPES.ORDER,
    actions: [
      { label: "Update status", value: AUDIT_ACTIONS.ORDER_STATUS_UPDATE },
      { label: "Expire", value: AUDIT_ACTIONS.ORDER_EXPIRED },
    ],
  },
  {
    label: "Payment webhooks",
    value: AUDIT_RESOURCE_TYPES.PAYMENT_WEBHOOK_EVENT,
    actions: [
      { label: "Reprocess", value: AUDIT_ACTIONS.PAYMENT_WEBHOOK_REPROCESS },
      { label: "Send to manual review", value: AUDIT_ACTIONS.PAYMENT_WEBHOOK_MANUAL_REVIEW },
    ],
  },
  {
    label: "Refunds",
    value: AUDIT_RESOURCE_TYPES.REFUND,
    actions: [
      { label: "Request", value: AUDIT_ACTIONS.REFUND_REQUESTED },
      { label: "Approve", value: AUDIT_ACTIONS.REFUND_APPROVED },
      { label: "Reject", value: AUDIT_ACTIONS.REFUND_REJECTED },
      { label: "Schedule pickup", value: AUDIT_ACTIONS.REFUND_PICKUP_SCHEDULED },
      { label: "Receive item", value: AUDIT_ACTIONS.REFUND_ITEM_RECEIVED },
      { label: "Process", value: AUDIT_ACTIONS.REFUND_PROCESSING },
      { label: "Complete", value: AUDIT_ACTIONS.REFUND_COMPLETED },
      { label: "Fail", value: AUDIT_ACTIONS.REFUND_FAILED },
      { label: "Execution uncertain", value: AUDIT_ACTIONS.REFUND_EXECUTION_UNCERTAIN },
    ],
  },
  {
    label: "Roles",
    value: AUDIT_RESOURCE_TYPES.ROLE,
    actions: [
      { label: "Create", value: AUDIT_ACTIONS.ROLE_CREATE },
      { label: "Update", value: AUDIT_ACTIONS.ROLE_UPDATE },
      { label: "Replace permissions", value: AUDIT_ACTIONS.ROLE_PERMISSIONS_REPLACE },
      { label: "Delete", value: AUDIT_ACTIONS.ROLE_DELETE },
    ],
  },
  {
    label: "Users",
    value: AUDIT_RESOURCE_TYPES.USER,
    actions: [
      { label: "Update status", value: AUDIT_ACTIONS.USER_STATUS_UPDATE },
      { label: "Update role", value: AUDIT_ACTIONS.USER_ROLE_UPDATE },
    ],
  },
];

export const auditActorTypeOptions = [
  { label: "Users", value: AUDIT_ACTOR_TYPES.USER },
  { label: "System", value: AUDIT_ACTOR_TYPES.SYSTEM },
  { label: "Providers", value: AUDIT_ACTOR_TYPES.PROVIDER },
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
): action is AuditAction {
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
