export function SystemRoleNotice({ name }: { name: string }) {
  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">{name}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        This role is protected so its details and permissions remain consistent
        with the server authorization rules.
      </p>
    </section>
  );
}
