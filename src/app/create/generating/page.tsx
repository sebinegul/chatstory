"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { StepShell } from "@/components/flow/StepShell";
import { ProgressStages } from "@/components/generate/ProgressStages";

/** Minimum time on this screen so fast responses don't flash past the stages. */
const MIN_DISPLAY_MS = 18_000;
/** Brief beat after success before navigating to preview. */
const FINISH_HOLD_MS = 900;

export default function GeneratingPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    const sessionId = sessionStorage.getItem("chatstorySessionId");
    if (!sessionId) {
      router.replace("/create/upload");
      return;
    }

    let cancelled = false;
    let finishTimer: number | undefined;

    (async () => {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Generation failed");
        if (cancelled) return;

        const elapsed = Date.now() - startedAt.current;
        const waitMore = Math.max(0, MIN_DISPLAY_MS - elapsed);

        finishTimer = window.setTimeout(() => {
          if (cancelled) return;
          setComplete(true);
          window.setTimeout(() => {
            if (!cancelled) router.replace("/create/preview");
          }, FINISH_HOLD_MS);
        }, waitMore);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Generation failed");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (finishTimer) window.clearTimeout(finishTimer);
    };
  }, [router]);

  return (
    <StepShell step={4} title="Writing your story">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      >
        <ProgressStages active={!error} complete={complete} />
      </motion.div>
      {error && (
        <div className="mt-8">
          <p className="text-sm text-[var(--danger)]">{error}</p>
          <button
            type="button"
            className="mt-4 text-sm text-[var(--accent)]"
            onClick={() => router.push("/create/configure")}
          >
            Go back
          </button>
        </div>
      )}
    </StepShell>
  );
}
