import { Button } from "@/shared/ui/button";

export function ManagementFormActions({
  mode,
  resourceLabel,
  isPending,
  isUploading,
}: {
  mode: "create" | "edit";
  resourceLabel: string;
  isPending: boolean;
  isUploading: boolean;
}) {
  return (
    <div className="flex justify-end">
      <Button type="submit" size="lg" disabled={isPending}>
        {isPending
          ? isUploading
            ? "Uploading..."
            : "Saving..."
          : mode === "edit"
            ? `Save ${resourceLabel}`
            : `Create ${resourceLabel}`}
      </Button>
    </div>
  );
}
