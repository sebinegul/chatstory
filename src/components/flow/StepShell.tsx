import { ChatStoryMark } from "@/components/brand/ChatStoryMark";

export function StepShell({
  step,
  total = 6,
  title,
  subtitle,
  children,
}: {
  step: number;
  total?: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const progress = Math.round((step / total) * 100);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 paper-wash" aria-hidden />
      <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-[rgba(217,119,6,0.08)] blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-16 bottom-10 h-64 w-64 rounded-full bg-[rgba(146,64,14,0.06)] blur-3xl" aria-hidden />

      <div className="relative">
        <div className="h-1 w-full bg-[rgba(146,64,14,0.12)]">
          <div
            className="h-full bg-[var(--gold-deep)] transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-6">
          <ChatStoryMark size="sm" />
          <div className="text-right">
            <p className="font-[family-name:var(--font-jost)] text-[10px] uppercase tracking-[0.22em] text-[var(--gold-deep)]">
              Chapter {step}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              of {total}
            </p>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-5 pb-20">
          <p className="font-[family-name:var(--font-jost)] text-[11px] uppercase tracking-[0.24em] text-[var(--gold-deep)]">
            ChatStory
          </p>
          <h1 className="mt-3 max-w-xl font-[family-name:var(--font-cormorant)] text-4xl font-semibold leading-tight text-[var(--ink)] sm:text-5xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 max-w-lg font-[family-name:var(--font-eb-garamond)] text-lg text-[var(--ink-soft)]">
              {subtitle}
            </p>
          ) : null}
          <div className="mt-10 rounded-sm border border-[var(--rule)] bg-[rgba(255,251,235,0.72)] p-5 shadow-[var(--shadow)] sm:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
