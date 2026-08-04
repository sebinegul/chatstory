"use client";

import { formatDateDMY } from "@/lib/format-date";

export function StatsCard({
  stats,
}: {
  stats: {
    totalMessages: number;
    firstAt: string;
    lastAt: string;
    longestSilenceDays: number;
    mostActiveDay: string;
    participants?: string[];
    suggestedRelationship?: string;
  };
}) {
  const participantCount = stats.participants?.length ?? 0;
  const items = [
    { label: "Messages", value: stats.totalMessages.toLocaleString("en-IN") },
    {
      label: "People in the chat",
      value: participantCount > 0 ? String(participantCount) : "-",
    },
    {
      label: "First message",
      value: formatDateDMY(stats.firstAt),
    },
    {
      label: "Last message",
      value: formatDateDMY(stats.lastAt),
    },
    { label: "Longest silence", value: `${stats.longestSilenceDays} days` },
    { label: "Most active day", value: stats.mostActiveDay || "-" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--rule)] bg-[var(--surface)] px-6 py-8 shadow-[var(--shadow)]">
      <p className="font-[family-name:var(--font-space)] text-sm font-medium text-[var(--accent)]">
        Your chat in numbers
      </p>
      {stats.suggestedRelationship === "group" ? (
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          Looks like a group chat. Next step we&apos;ll prefill the top talkers
          so the story can cover the whole cast.
        </p>
      ) : null}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label}>
            <p className="font-[family-name:var(--font-space)] text-3xl font-semibold text-[var(--ink)] sm:text-4xl">
              {item.value}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
