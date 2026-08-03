"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StepShell } from "@/components/flow/StepShell";
import { StatsCard } from "@/components/stats/StatsCard";

type Stats = {
  totalMessages: number;
  firstAt: string;
  lastAt: string;
  longestSilenceDays: number;
  mostActiveDay: string;
  keyword: string;
  keywordCount: number;
  participants: string[];
};

export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [keyword, setKeyword] = useState("love");
  const [error, setError] = useState<string | null>(null);

  async function load(kw: string) {
    const sessionId = sessionStorage.getItem("chatstorySessionId");
    if (!sessionId) {
      router.replace("/create/upload");
      return;
    }
    const res = await fetch(
      `/api/stats?sessionId=${encodeURIComponent(sessionId)}&keyword=${encodeURIComponent(kw)}`,
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not load stats");
      return;
    }
    setStats(data);
    sessionStorage.setItem("chatstoryParticipants", JSON.stringify(data.participants || []));
  }

  useEffect(() => {
    void load(keyword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StepShell step={2} title="Your chat in numbers">
      {stats ? <StatsCard stats={stats} /> : <p className="text-[var(--muted)]">Counting...</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Count a word"
          className="min-w-[12rem] flex-1 rounded-sm border border-[var(--rule)] bg-transparent px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => void load(keyword)}
          className="rounded-sm border border-[var(--rule)] px-4 py-2 text-sm"
        >
          Recount
        </button>
      </div>
      {error && <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>}
      <button
        type="button"
        onClick={() => router.push("/create/configure")}
        className="mt-8 rounded-sm bg-[var(--gold-deep)] px-6 py-3 text-sm text-[var(--paper)]"
      >
        Continue
      </button>
    </StepShell>
  );
}
