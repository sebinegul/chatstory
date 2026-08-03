export function Watermark({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden"
    >
      <span className="rotate-[-28deg] select-none font-[family-name:var(--font-jost)] text-5xl font-medium tracking-[0.35em] text-[rgba(28,25,23,0.12)] sm:text-7xl">
        PREVIEW
      </span>
    </div>
  );
}
