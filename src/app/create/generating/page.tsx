"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StepShell } from "@/components/flow/StepShell";
import { ProgressStages } from "@/components/generate/ProgressStages";

export default function GeneratingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = sessionStorage.getItem("chatstorySessionId");
    if (!sessionId) {
      router.replace("/create/upload");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Generation failed");
        if (!cancelled) router.replace("/create/preview");
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Generation failed");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <StepShell step={4} title="Writing your story">
      <ProgressStages active={!error} />
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
