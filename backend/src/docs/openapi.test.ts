import assert from "node:assert/strict";
import test from "node:test";

import { openApiDocument } from "./openapi.js";

test("every local OpenAPI reference resolves", () => {
  const references = collectLocalReferences(openApiDocument);

  assert.ok(references.size > 0, "the document should contain local references");

  for (const reference of references) {
    assert.doesNotThrow(
      () => resolveJsonPointer(openApiDocument, reference),
      `unresolved OpenAPI reference: ${reference}`,
    );
  }
});

test("contract-backed OpenAPI schemas preserve strict request boundaries", () => {
  const updateProduct = openApiDocument.components.schemas.UpdateProductRequest;

  assert.equal(updateProduct.additionalProperties, false);
  assert.ok(isRecord(updateProduct.properties));
  assert.equal("stockQuantity" in updateProduct.properties, false);
  assert.equal("isDeleted" in updateProduct.properties, false);
});

function collectLocalReferences(value: unknown, references = new Set<string>()) {
  if (Array.isArray(value)) {
    for (const entry of value) {
      collectLocalReferences(entry, references);
    }

    return references;
  }

  if (!isRecord(value)) {
    return references;
  }

  if (typeof value.$ref === "string" && value.$ref.startsWith("#/")) {
    references.add(value.$ref);
  }

  for (const entry of Object.values(value)) {
    collectLocalReferences(entry, references);
  }

  return references;
}

function resolveJsonPointer(document: unknown, pointer: string): unknown {
  let current = document;

  for (const rawSegment of pointer.slice(2).split("/")) {
    const segment = rawSegment.replaceAll("~1", "/").replaceAll("~0", "~");

    assert.ok(isRecord(current), `"${segment}" has no object parent`);
    assert.ok(
      Object.hasOwn(current, segment),
      `JSON pointer segment "${segment}" does not exist`,
    );
    current = current[segment];
  }

  return current;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
