"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";

const STAGES = [
  {
    label: "Reading your chat...",
    holdMs: 7000,
    hints: [
      "Scanning timestamps and voices",
      "Noticing who talks the most",
      "Keeping the ordinary days too",
    ],
  },
  {
    label: "Finding your story...",
    holdMs: 9000,
    hints: [
      "Looking for turning points",
      "Gathering the strongest threads",
      "Skipping the filler",
    ],
  },
  {
    label: "Writing chapters...",
    holdMs: 12000,
    hints: [
      "Shaping openings around real lines",
      "Letting quotes carry the feeling",
      "Matching the relationship you chose",
    ],
  },
  {
    label: "Polishing the pages...",
    holdMs: 10000,
    hints: [
      "Keeping the voice human",
      "Checking for invented moments",
      "Making it read like a memory",
      "Almost there — still shaping",
      "Taking care with the last pages",
    ],
  },
] as const;

const EASE = [0.23, 1, 0.32, 1] as const;

export function ProgressStages({
  active,
  complete = false,
}: {
  active: boolean;
  /** Set true when /api/generate has finished successfully. */
  complete?: boolean;
}) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [hintIndex, setHintIndex] = useState(0);
  const [progress, setProgress] = useState(0.04);

  // Advance stages on a slow schedule; linger on the last while waiting.
  useEffect(() => {
    if (!active || complete) return;
    const hold = STAGES[index]?.holdMs ?? 8000;
    const id = window.setTimeout(() => {
      setIndex((i) => (i < STAGES.length - 1 ? i + 1 : i));
      setHintIndex(0);
    }, hold);
    return () => window.clearTimeout(id);
  }, [active, complete, index]);

  // Rotate soft hints so the last stage never feels frozen.
  useEffect(() => {
    if (!active || complete) return;
    const hints = STAGES[index].hints;
    if (hints.length <= 1) return;
    const id = window.setInterval(() => {
      setHintIndex((h) => (h + 1) % hints.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [active, complete, index]);

  // Progress bar eases toward ~88% while pending, then fills on complete.
  useEffect(() => {
    if (!active) return;
    if (complete) {
      setProgress(1);
      return;
    }
    const id = window.setInterval(() => {
      setProgress((p) => {
        const stageTarget = 0.12 + (index / (STAGES.length - 1)) * 0.62;
        const ceiling = Math.min(0.88, Math.max(stageTarget, p + 0.008));
        // Asymptotic crawl so long waits still feel alive
        return p + (ceiling - p) * 0.08;
      });
    }, 400);
    return () => window.clearInterval(id);
  }, [active, complete, index]);

  // When generation finishes, jump to the last stage visually.
  useEffect(() => {
    if (complete) setIndex(STAGES.length - 1);
  }, [complete]);

  const current = STAGES[index];
  const hint = current.hints[hintIndex % current.hints.length];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--rule)] bg-[var(--surface)] px-6 py-8 shadow-[var(--shadow)]">
      {/* Soft breathing atmosphere */}
      {!reduce && active && !complete ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--accent-soft)]"
          animate={{ opacity: [0.35, 0.55, 0.35], scale: [1, 1.08, 1] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}

      <div className="relative">
        <p className="font-[family-name:var(--font-space)] text-sm font-medium text-[var(--accent)]">
          {complete ? "Ready" : "Working on your book"}
        </p>

        {/* Progress track */}
        <div
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--rule)]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label="Book generation progress"
        >
          <motion.div
            className="h-full rounded-full bg-[var(--accent)]"
            initial={false}
            animate={{ width: `${Math.round(progress * 100)}%` }}
            transition={{ duration: reduce ? 0 : 0.45, ease: EASE }}
          />
        </div>

        <ul className="mt-8 space-y-5">
          {STAGES.map((stage, i) => {
            const done = i < index || complete;
            const isCurrent = i === index && !complete;
            return (
              <li key={stage.label} className="flex items-start gap-3">
                <span className="relative mt-2 flex h-2.5 w-2.5 shrink-0 items-center justify-center">
                  <span
                    className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${
                      isCurrent || done
                        ? "bg-[var(--accent)]"
                        : "bg-[var(--rule)]"
                    }`}
                  />
                  {isCurrent && !reduce ? (
                    <motion.span
                      className="absolute inset-0 rounded-full bg-[var(--accent)]"
                      animate={{ scale: [1, 2.2], opacity: [0.45, 0] }}
                      transition={{
                        duration: 1.6,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                    />
                  ) : null}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={`font-[family-name:var(--font-eb-garamond)] text-xl transition-[opacity,color,transform] duration-300 ${
                      isCurrent
                        ? "translate-y-0 text-[var(--ink)] opacity-100"
                        : done
                          ? "text-[var(--muted)] opacity-70"
                          : "text-[var(--muted)] opacity-35"
                    }`}
                  >
                    {stage.label}
                  </p>

                  <div className="mt-1 min-h-[1.25rem]">
                    <AnimatePresence mode="wait">
                      {isCurrent ? (
                        <motion.p
                          key={`${stage.label}-${hint}`}
                          initial={
                            reduce ? false : { opacity: 0, y: 6 }
                          }
                          animate={{ opacity: 1, y: 0 }}
                          exit={
                            reduce ? undefined : { opacity: 0, y: -4 }
                          }
                          transition={{ duration: 0.28, ease: EASE }}
                          className="text-sm text-[var(--muted)]"
                        >
                          {hint}
                        </motion.p>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {active && !complete ? (
          <motion.p
            className="mt-8 text-xs tracking-wide text-[var(--muted)]"
            animate={reduce ? undefined : { opacity: [0.45, 0.85, 0.45] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          >
            Good books take a quiet minute — hang on.
          </motion.p>
        ) : null}
      </div>
    </div>
  );
}
