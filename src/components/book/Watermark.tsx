export function Watermark({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden"
    >
      <span className="rotate-[-28deg] select-none font-[family-name:var(--font-jost)] text-5xl font-medium tracking-[0.35em] text-[color-mix(in_srgb,var(--ink)_12%,transparent)] sm:text-7xl">
        PREVIEW
      </span>
    </div>
  );
}
