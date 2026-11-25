import { groupPermissionNames } from "./role-form";

export type PermissionSummary = {
  group: string;
  title: string;
  actions: string[];
};

const ACTION_VERBS: Record<string, string> = {
  read: "View",
  create: "Create",
  update: "Update",
  delete: "Delete",
  execute: "Execute",
  reprocess: "Reprocess",
};

export function formatPermissionAction(label: string) {
  const words = label
    .replaceAll(".", " ")
    .replaceAll("_", " ")
    .split(/\s+/)
    .filter(Boolean);
  const actionIndex = words.findIndex((word) => word in ACTION_VERBS);

  if (actionIndex === -1) {
    return words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  const verb = ACTION_VERBS[words[actionIndex]];
  const subject = words
    .filter((_, index) => index !== actionIndex)
    .join(" ");

  return subject ? `${verb} ${subject}` : verb;
}

export function summarizePermissions(
  permissionNames: string[],
): PermissionSummary[] {
  return groupPermissionNames(permissionNames).map(([group, items]) => ({
    group,
    title: group.replaceAll("_", " "),
    actions: items.map((item) => formatPermissionAction(item.label)),
  }));
}
