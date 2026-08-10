import { RotateCcw } from "lucide-react";

export function OrderReturnUnavailable({ message }: { message: string }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <RotateCcw className="size-5" strokeWidth={1.7} />
        <h2 className="font-semibold">Returns</h2>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{message}</p>
    </section>
  );
}
