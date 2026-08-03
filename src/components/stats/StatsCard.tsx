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

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-[var(--border-glass)] bg-white/[0.04] px-6 py-8">
      <p className="font-[family-name:var(--font-space)] text-xs uppercase tracking-[0.2em] text-[#2dd4bf]">
        Our WhatsApp in numbers
      </p>
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
