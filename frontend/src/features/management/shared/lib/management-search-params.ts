export type ManagementSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

export function getManagementPage(
  value: string | string[] | undefined,
): number {
  const pageValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(pageValue ?? "1", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function getManagementQuery(
  value: string | string[] | undefined,
): string | undefined {
  const query = (Array.isArray(value) ? value[0] : value)?.trim();

  return query || undefined;
}

export function getManagementFilter(
  value: string | string[] | undefined,
): string | undefined {
  const filter = (Array.isArray(value) ? value[0] : value)?.trim();

  return filter && filter !== "all" ? filter : undefined;
}
