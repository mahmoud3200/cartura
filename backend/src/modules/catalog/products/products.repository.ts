import type {
  CreateProductRequest,
  ListProductsQuery,
  UpdateProductRequest,
} from "@cartura/contracts/catalog";

import type { RecordAuditLogInput } from "../../audit-logs/audit-logs.types.js";
import { ProductsMutationRepository } from "./products-mutation.repository.js";
import { ProductsQueryRepository } from "./products-query.repository.js";

export {
  buildProductWhere,
  type ProductWithRelations,
} from "./products-query.repository.js";

export class ProductsRepository {
  constructor(
    private readonly queries = new ProductsQueryRepository(),
    private readonly mutations = new ProductsMutationRepository(),
  ) {}

  list(query: ListProductsQuery) {
    return this.queries.list(query);
  }

  listByCategory(categorySlug: string, query: ListProductsQuery) {
    return this.queries.listByCategory(categorySlug, query);
  }

  findActiveById(productId: string) {
    return this.queries.findActiveById(productId);
  }

  findBySlug(slug: string) {
    return this.queries.findBySlug(slug);
  }

  findBySku(sku: string) {
    return this.queries.findBySku(sku);
  }

  create(
    input: CreateProductRequest,
    createdBy?: string,
    audit?: RecordAuditLogInput,
  ) {
    return this.mutations.create(input, createdBy, audit);
  }

  update(
    productId: string,
    input: UpdateProductRequest,
    audit?: RecordAuditLogInput,
  ) {
    return this.mutations.update(productId, input, audit);
  }

  updateInventory(
    productId: string,
    stockQuantity: number,
    audit?: RecordAuditLogInput,
  ) {
    return this.mutations.updateInventory(productId, stockQuantity, audit);
  }

  softDelete(productId: string, audit?: RecordAuditLogInput) {
    return this.mutations.softDelete(productId, audit);
  }
}

export const productsRepository = new ProductsRepository();
