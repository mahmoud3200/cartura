import { Input } from "@/shared/ui/input";
import type {
  CategoryFieldErrors,
  CategoryFormState,
} from "../../lib/category-form";
import { ManagementFormField } from "@/features/management/shared/components/management-form-field";

export function CategoryDetailsFields({
  form,
  errors,
  onChange,
}: {
  form: CategoryFormState;
  errors: CategoryFieldErrors;
  onChange: <TKey extends keyof CategoryFormState>(
    key: TKey,
    value: CategoryFormState[TKey],
  ) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ManagementFormField label="Name" htmlFor="category-name" error={errors.name}>
        <Input
          id="category-name"
          value={form.name}
          onChange={(event) => onChange("name", event.target.value)}
          placeholder="Bags"
          aria-invalid={Boolean(errors.name)}
        />
      </ManagementFormField>

      <ManagementFormField label="Slug" htmlFor="category-slug" error={errors.slug}>
        <Input
          id="category-slug"
          value={form.slug}
          onChange={(event) =>
            onChange("slug", event.target.value.toLowerCase())
          }
          placeholder="bags"
          autoCapitalize="none"
          spellCheck={false}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          aria-invalid={Boolean(errors.slug)}
        />
      </ManagementFormField>

      <div className="md:col-span-2">
        <ManagementFormField
          label="Description"
          htmlFor="category-description"
          error={errors.description}
        >
          <textarea
            id="category-description"
            value={form.description}
            onChange={(event) => onChange("description", event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            placeholder="Short category description"
            aria-invalid={Boolean(errors.description)}
          />
        </ManagementFormField>
      </div>
    </div>
  );
}
