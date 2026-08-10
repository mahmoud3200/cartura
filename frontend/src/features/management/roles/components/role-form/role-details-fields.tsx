import { ManagementFormField } from "@/features/management/shared/components/management-form-field";
import { Input } from "@/shared/ui/input";
import type { RoleFieldErrors, RoleFormState } from "../../lib/role-form";

export function RoleDetailsFields({
  form,
  errors,
  onChange,
}: {
  form: RoleFormState;
  errors: RoleFieldErrors;
  onChange: (
    key: "name" | "description",
    value: string,
  ) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ManagementFormField
        label="Role name"
        htmlFor="role-name"
        error={errors.name}
      >
        <Input
          id="role-name"
          value={form.name}
          onChange={(event) => onChange("name", event.target.value)}
          placeholder="Operations manager"
          aria-invalid={Boolean(errors.name)}
        />
      </ManagementFormField>
      <ManagementFormField
        label="Description"
        htmlFor="role-description"
        error={errors.description}
      >
        <Input
          id="role-description"
          value={form.description}
          onChange={(event) => onChange("description", event.target.value)}
          placeholder="Can manage daily order operations"
          aria-invalid={Boolean(errors.description)}
        />
      </ManagementFormField>
    </div>
  );
}
