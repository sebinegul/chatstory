import type { ParsedChat, ParsedMessage } from "@/lib/parser/types";

export interface ScanWindow {
  label: string;
  startAt: Date;
  endAt: Date;
  messages: ParsedMessage[];
}

export interface ChapterIdea {
  title: string;
  startAt: Date;
  endAt: Date;
  tone?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function calendarDayDiff(a: Date, b: Date): number {
  const startA = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const startB = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((startB - startA) / DAY_MS);
}

function dayBounds(messages: ParsedMessage[]): { startAt: Date; endAt: Date } {
  return {
    startAt: messages[0].at,
    endAt: messages[messages.length - 1].at,
  };
}

export function buildWindows(
  chat: ParsedChat,
  specialDates: { label: string; date: string }[],
): ScanWindow[] {
  return specialDates.map(({ label, date }) => {
    const target = parseDateString(date);
    const messages = chat.messages.filter(
      (m) => Math.abs(calendarDayDiff(m.at, target)) <= 2,
    );

    if (messages.length === 0) {
      return { label, startAt: target, endAt: target, messages };
    }

    const { startAt, endAt } = dayBounds(messages);
    return { label, startAt, endAt, messages };
  });
}

export function proposeChaptersFromScan(
  chat: ParsedChat,
  max = 15,
): ChapterIdea[] {
  if (chat.messages.length === 0) return [];

  const { messages } = chat;
  const ideas: ChapterIdea[] = [];

  ideas.push({
    title: "The Beginning",
    startAt: messages[0].at,
    endAt: messages[0].at,
    tone: "opening",
  });

  ideas.push({
    title: "Where We Are Now",
    startAt: messages[messages.length - 1].at,
    endAt: messages[messages.length - 1].at,
    tone: "closing",
  });

  const byDay = new Map<string, ParsedMessage[]>();
  for (const m of messages) {
    const key = toDayKey(m.at);
    const list = byDay.get(key) ?? [];
    list.push(m);
    byDay.set(key, list);
  }

  const sortedDays = [...byDay.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  );
  for (const [day, dayMessages] of sortedDays.slice(0, 10)) {
    const { startAt, endAt } = dayBounds(dayMessages);
    ideas.push({
      title: `Burst: ${day}`,
      startAt,
      endAt,
      tone: "high-energy",
    });
  }

  let maxGap = 0;
  let gapIndex = -1;
  for (let i = 1; i < messages.length; i++) {
    const gap = Math.floor(
      (messages[i].at.getTime() - messages[i - 1].at.getTime()) / DAY_MS,
    );
    if (gap > maxGap) {
      maxGap = gap;
      gapIndex = i;
    }
  }
  if (gapIndex > 0 && maxGap > 0) {
    ideas.push({
      title: "The Long Pause",
      startAt: messages[gapIndex - 1].at,
      endAt: messages[gapIndex].at,
      tone: "reflective",
    });
  }

  const affectionPattern = /\b(love|miss|sorry|hugs?|kiss|heart)\b/i;
  const keywordDays = new Map<string, ParsedMessage[]>();
  for (const m of messages) {
    if (!affectionPattern.test(m.body)) continue;
    const key = toDayKey(m.at);
    const list = keywordDays.get(key) ?? [];
    list.push(m);
    keywordDays.set(key, list);
  }

  const sortedKeywordDays = [...keywordDays.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  );
  for (const [, dayMessages] of sortedKeywordDays.slice(0, 5)) {
    const { startAt, endAt } = dayBounds(dayMessages);
    ideas.push({
      title: "Tender Moments",
      startAt,
      endAt,
      tone: "warm",
    });
  }

  const seen = new Set<string>();
  const unique: ChapterIdea[] = [];
  for (const idea of ideas) {
    const key = `${idea.title}|${idea.startAt.getTime()}|${idea.endAt.getTime()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(idea);
    if (unique.length >= max) break;
  }

  return unique.slice(0, max);
}
