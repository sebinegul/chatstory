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
  keyword: string;
  keywordCount: number;
  suggestedKeyword: string;
  topKeywords: { word: string; count: number }[];
  participants: string[];
};

export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recounting, setRecounting] = useState(false);

  async function load(kw: string | undefined, isRecount = false) {
    const sessionId = sessionStorage.getItem("chatstorySessionId");
    if (!sessionId) {
      router.replace("/create/upload");
      return;
    }
    if (isRecount) setRecounting(true);
    else setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ sessionId });
      if (kw !== undefined) qs.set("keyword", kw);
      const res = await fetch(`/api/stats?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load stats");
        return;
      }
      setStats(data);
      setKeyword(data.keyword || data.suggestedKeyword || "");
      sessionStorage.setItem(
        "chatstoryParticipants",
        JSON.stringify(data.participants || []),
      );
      sessionStorage.setItem(
        "chatstoryKeyword",
        data.keyword || data.suggestedKeyword || "",
      );
      if (data.topKeywords) {
        sessionStorage.setItem(
          "chatstoryTopKeywords",
          JSON.stringify(data.topKeywords),
        );
      }
    } catch {
      setError("Could not load stats");
    } finally {
      setLoading(false);
      setRecounting(false);
    }
  }

  useEffect(() => {
    // First load: auto-detect most used word (omit keyword param)
    void load(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StepShell step={2} title="Your chat in numbers">
      {loading && <LoadingBlock label="Counting your messages..." />}
      {!loading && stats ? <StatsCard stats={stats} /> : null}

      {!loading && stats?.topKeywords?.length ? (
        <div className="mt-6">
          <p className="text-sm text-[var(--muted)]">Words you used most</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {stats.topKeywords.map((k) => (
              <button
                key={k.word}
                type="button"
                onClick={() => {
                  setKeyword(k.word);
                  void load(k.word, true);
                }}
                className={`rounded-sm border px-3 py-1.5 text-sm ${
                  keyword === k.word
                    ? "border-[var(--gold)] bg-[var(--paper-deep)]"
                    : "border-[var(--rule)]"
                }`}
              >
                {k.word} · {k.count}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Keyword from your chat"
          disabled={loading || recounting}
          className="min-w-[12rem] flex-1 rounded-sm border border-[var(--rule)] bg-transparent px-3 py-2 text-sm disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => void load(keyword, true)}
          disabled={loading || recounting}
          className="rounded-sm border border-[var(--rule)] px-4 py-2 text-sm disabled:opacity-60"
        >
          {recounting ? "Counting..." : "Recount"}
        </button>
      </div>
      {error && <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>}
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem("chatstoryKeyword", keyword);
          router.push("/create/configure");
        }}
        disabled={loading || !stats}
        className="mt-8 rounded-sm bg-[var(--gold-deep)] px-6 py-3 text-sm text-[var(--paper)] disabled:opacity-60"
      >
        Continue
      </button>
    </StepShell>
  );
}
