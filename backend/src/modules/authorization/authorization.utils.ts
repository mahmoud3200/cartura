export function includesAllPermissions(
  grantedPermissions: readonly string[],
  requiredPermissions: readonly string[],
) {
  if (requiredPermissions.length === 0) {
    return true;
  }

  const granted = new Set(grantedPermissions);

  return requiredPermissions.every((permission) => granted.has(permission));
}

export function includesAnyPermission(
  grantedPermissions: readonly string[],
  allowedPermissions: readonly string[],
) {
  if (allowedPermissions.length === 0) {
    return true;
  }

  const granted = new Set(grantedPermissions);

  return allowedPermissions.some((permission) => granted.has(permission));
}
