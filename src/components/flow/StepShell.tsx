"use client";

import { motion, useReducedMotion } from "framer-motion";
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
  const reduce = useReducedMotion();

  return (
    <div className="min-h-[100dvh] bg-[var(--paper)]">
      <div className="h-1 w-full bg-[var(--rule)]">
        <motion.div
          className="h-full bg-[var(--accent)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </div>

      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-6">
        <ChatStoryMark size="sm" />
        <p className="text-sm text-[var(--muted)]">Step {step} of {total}</p>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-20">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        >
          <h1 className="font-[family-name:var(--font-space)] text-3xl font-semibold leading-tight tracking-tight text-[var(--ink)] sm:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 text-[var(--ink-soft)]">{subtitle}</p>
          ) : null}
          <div className="surface-panel mt-10 p-5 sm:p-8">{children}</div>
        </motion.div>
      </main>
    </div>
  );
}
