import type {
  CreateCategoryRequest,
  ListCategoriesQuery,
  UpdateCategoryRequest,
} from "@cartura/contracts/catalog";

import type { RecordAuditLogInput } from "../../audit-logs/audit-logs.types.js";
import { CategoriesMutationRepository } from "./categories-mutation.repository.js";
import { CategoriesQueryRepository } from "./categories-query.repository.js";

export type {
  CategoryRepositoryRecord,
  CategoryWithLineage,
} from "./categories-query.repository.js";

export class CategoriesRepository {
  constructor(
    private readonly queries = new CategoriesQueryRepository(),
    private readonly mutations = new CategoriesMutationRepository(),
  ) {}

  list(query: ListCategoriesQuery) {
    return this.queries.list(query);
  }

  findActiveById(categoryId: string) {
    return this.queries.findActiveById(categoryId);
  }

  findVisibleById(categoryId: string) {
    return this.queries.findVisibleById(categoryId);
  }

  findBySlug(slug: string) {
    return this.queries.findBySlug(slug);
  }

  findBySlugAnyStatus(slug: string) {
    return this.queries.findBySlugAnyStatus(slug);
  }

  countActiveByIds(categoryIds: string[]) {
    return this.queries.countActiveByIds(categoryIds);
  }

  expandWithAncestorIds(categoryIds: string[]) {
    return this.queries.expandWithAncestorIds(categoryIds);
  }

  create(
    input: CreateCategoryRequest,
    createdBy?: string,
    audit?: RecordAuditLogInput,
  ) {
    return this.mutations.create(input, createdBy, audit);
  }

  update(
    categoryId: string,
    input: UpdateCategoryRequest,
    audit?: RecordAuditLogInput,
  ) {
    return this.mutations.update(categoryId, input, audit);
  }

  softDelete(categoryId: string, audit?: RecordAuditLogInput) {
    return this.mutations.softDelete(categoryId, audit);
  }
}

export const categoriesRepository = new CategoriesRepository();
