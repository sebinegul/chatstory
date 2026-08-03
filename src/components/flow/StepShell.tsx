import { ChatStoryMark } from "@/components/brand/ChatStoryMark";

export function StepShell({
  step,
  total = 6,
  title,
  children,
}: {
  step: number;
  total?: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-6">
        <ChatStoryMark size="sm" />
        <p className="font-[family-name:var(--font-jost)] text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          Step {step} of {total}
        </p>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-16">
        <h1 className="font-[family-name:var(--font-cormorant)] text-3xl font-semibold text-[var(--ink)] sm:text-4xl">
          {title}
        </h1>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
