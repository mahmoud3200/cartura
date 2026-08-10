import { ManagementFormField } from "@/features/management/shared/components/management-form-field";
import { Input } from "@/shared/ui/input";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/shared/ui/number-field";
import type {
  ProductFieldErrors,
  ProductFormState,
} from "../../lib/product-form";

export function ProductDetailsFields({
  form,
  errors,
  onChange,
}: {
  form: ProductFormState;
  errors: ProductFieldErrors;
  onChange: <TKey extends keyof ProductFormState>(
    key: TKey,
    value: ProductFormState[TKey],
  ) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField
        id="product-name"
        label="Name"
        value={form.name}
        placeholder="Signature tote bag"
        error={errors.name}
        onChange={(value) => onChange("name", value)}
      />
      <TextField
        id="product-slug"
        label="Slug"
        value={form.slug}
        placeholder="signature-tote-bag"
        error={errors.slug}
        onChange={(value) => onChange("slug", value.toLowerCase())}
        slug
      />
      <TextField
        id="product-sku"
        label="SKU"
        value={form.sku}
        placeholder="BAG-TOTE-001"
        error={errors.sku}
        onChange={(value) => onChange("sku", value)}
      />
      <ProductNumberField
        label="Price"
        value={form.price}
        step={0.01}
        placeholder="1200"
        error={errors.price}
        onChange={(value) => onChange("price", value)}
      />
      <ProductNumberField
        label="Stock quantity"
        value={form.stockQuantity}
        step={1}
        placeholder="24"
        error={errors.stockQuantity}
        onChange={(value) => onChange("stockQuantity", value)}
      />
      <div className="md:col-span-2">
        <ManagementFormField
          label="Description"
          htmlFor="product-description"
          error={errors.description}
        >
          <textarea
            id="product-description"
            value={form.description}
            onChange={(event) => onChange("description", event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            placeholder="Short product description"
            aria-invalid={Boolean(errors.description)}
          />
        </ManagementFormField>
      </div>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  placeholder,
  error,
  onChange,
  slug = false,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  error?: string;
  onChange: (value: string) => void;
  slug?: boolean;
}) {
  return (
    <ManagementFormField label={label} htmlFor={id} error={error}>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoCapitalize={slug ? "none" : undefined}
        spellCheck={slug ? false : undefined}
        pattern={slug ? "[a-z0-9]+(?:-[a-z0-9]+)*" : undefined}
        aria-invalid={Boolean(error)}
      />
    </ManagementFormField>
  );
}

function ProductNumberField({
  label,
  value,
  step,
  placeholder,
  error,
  onChange,
}: {
  label: string;
  value: number | null;
  step: number;
  placeholder: string;
  error?: string;
  onChange: (value: number | null) => void;
}) {
  return (
    <ManagementFormField label={label} error={error}>
      <NumberField min={0} step={step} value={value} onValueChange={onChange}>
        <NumberFieldGroup>
          <NumberFieldDecrement />
          <NumberFieldInput
            placeholder={placeholder}
            aria-invalid={Boolean(error)}
          />
          <NumberFieldIncrement />
        </NumberFieldGroup>
      </NumberField>
    </ManagementFormField>
  );
}
