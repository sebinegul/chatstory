"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StepShell } from "@/components/flow/StepShell";
import { LoadingBlock } from "@/components/flow/LoadingBlock";
import { StatsCard } from "@/components/stats/StatsCard";

type Stats = {
  totalMessages: number;
  firstAt: string;
  lastAt: string;
  longestSilenceDays: number;
  mostActiveDay: string;
  participants: string[];
};

export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = sessionStorage.getItem("chatstorySessionId");
    if (!sessionId) {
      router.replace("/create/upload");
      return;
    }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/stats?sessionId=${encodeURIComponent(sessionId)}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Could not load stats");
          return;
        }
        setStats(data);
        sessionStorage.setItem(
          "chatstoryParticipants",
          JSON.stringify(data.participants || []),
        );
      } catch {
        setError("Could not load stats");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  return (
    <StepShell step={2} title="Your chat in numbers">
      {loading && <LoadingBlock label="Counting your messages..." />}
      {!loading && stats ? <StatsCard stats={stats} /> : null}
      {error && <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>}
      <button
        type="button"
        onClick={() => router.push("/create/configure")}
        disabled={loading || !stats}
        className="mt-8 btn-primary cursor-pointer px-6 py-3 text-sm disabled:opacity-60"
      >
        Continue
      </button>
    </StepShell>
  );
}
