"use client";

import { motion } from "framer-motion";
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
      <div className="ambient-glow pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute right-[-10%] top-20 h-72 w-72 rounded-full bg-[rgba(45,212,191,0.12)] blur-[90px]"
        aria-hidden
      />

      <div className="relative">
        <div className="h-1 w-full bg-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-[#2dd4bf] to-[#38bdf8]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-6">
          <ChatStoryMark size="sm" />
          <div className="text-right">
            <p className="font-[family-name:var(--font-space)] text-[10px] uppercase tracking-[0.22em] text-[#2dd4bf]">
              Step {step}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">of {total}</p>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-5 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-[family-name:var(--font-space)] text-[11px] uppercase tracking-[0.24em] text-[#2dd4bf]">
              ChatStory
            </p>
            <h1 className="mt-3 max-w-xl font-[family-name:var(--font-space)] text-3xl font-semibold leading-tight tracking-tight text-[var(--ink)] sm:text-4xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-3 max-w-lg text-base text-[var(--ink-soft)]">{subtitle}</p>
            ) : null}
            <div className="glass-panel mt-10 rounded-[1.5rem] p-5 sm:p-8">{children}</div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
