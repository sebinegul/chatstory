import type { ParsedChat } from "@/lib/parser/types";

export interface ChatStats {
  totalMessages: number;
  firstAt: Date;
  lastAt: Date;
  longestSilenceDays: number;
  mostActiveDay: string;
  keyword: string;
  keywordCount: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function computeLongestSilenceDays(messages: { at: Date }[]): number {
  if (messages.length < 2) return 0;

  let max = 0;
  for (let i = 1; i < messages.length; i++) {
    const gap = Math.floor(
      (messages[i].at.getTime() - messages[i - 1].at.getTime()) / DAY_MS,
    );
    if (gap > max) max = gap;
  }
  return max;
}

function computeMostActiveDay(messages: { at: Date }[]): string {
  if (messages.length === 0) return "";

  const counts = new Map<string, number>();
  for (const m of messages) {
    const key = toDayKey(m.at);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  let best = "";
  let bestCount = 0;
  for (const [day, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      best = day;
    }
  }
  return best;
}

export function computeStats(chat: ParsedChat, keyword?: string): ChatStats {
  const kw = keyword ?? "";
  const keywordCount = kw
    ? chat.messages.filter((m) =>
        m.body.toLowerCase().includes(kw.toLowerCase()),
      ).length
    : 0;

  return {
    totalMessages: chat.messages.length,
    firstAt: chat.firstAt,
    lastAt: chat.lastAt,
    longestSilenceDays: computeLongestSilenceDays(chat.messages),
    mostActiveDay: computeMostActiveDay(chat.messages),
    keyword: kw,
    keywordCount,
  };
}
