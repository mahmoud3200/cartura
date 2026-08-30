export type CatalogPersistenceConflictKind =
  | "category_cycle"
  | "category_hierarchy"
  | "concurrent_update"
  | "media_attachment"
  | "unique_constraint";

export class CatalogPersistenceConflictError extends Error {
  constructor(readonly kind: CatalogPersistenceConflictKind) {
    super(`Catalog persistence conflict: ${kind}`);
    this.name = "CatalogPersistenceConflictError";
  }
}
