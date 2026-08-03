export function LoadingBlock({
  label = "Loading...",
}: {
  label?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-10 text-[var(--muted)]" role="status">
      <span
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--rule)] border-t-[var(--gold-deep)]"
        aria-hidden
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
