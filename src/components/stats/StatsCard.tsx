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
    keyword: string;
    keywordCount: number;
  };
}) {
  const items = [
    { label: "Messages", value: stats.totalMessages.toLocaleString("en-IN") },
    {
      label: "First message",
      value: formatDateDMY(stats.firstAt),
    },
    {
      label: "Last message",
      value: formatDateDMY(stats.lastAt),
    },
    { label: "Longest silence", value: `${stats.longestSilenceDays} days` },
    { label: "Most active day", value: stats.mostActiveDay || "—" },
  ];

  if (stats.keyword) {
    items.push({
      label: `Times you said “${stats.keyword}”`,
      value: stats.keywordCount.toLocaleString("en-IN"),
    });
  }

  return (
    <div className="overflow-hidden rounded-sm bg-[var(--paper-deep)] px-6 py-8 shadow-[0_1px_0_var(--rule)]">
      <p className="font-[family-name:var(--font-jost)] text-xs uppercase tracking-[0.2em] text-[var(--gold-deep)]">
        Our WhatsApp in numbers
      </p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label}>
            <p className="font-[family-name:var(--font-cormorant)] text-3xl text-[var(--ink)] sm:text-4xl">
              {item.value}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
