export default function SettingsLoading() {
  return (
    <div className="animate-pulse space-y-8" aria-label="Loading account settings">
      <div className="h-10 w-56 rounded-lg bg-muted" />
      <div className="h-5 w-full max-w-xl rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-44 rounded-xl bg-muted" />
        <div className="h-44 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
