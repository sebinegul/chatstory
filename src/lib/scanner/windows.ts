import type { ParsedChat, ParsedMessage } from "@/lib/parser/types";
import { formatDayKeyDMY } from "@/lib/format-date";
import { windowStoryScore } from "@/lib/ai/quotes";

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

const BUSY_TITLES = [
  "A Day Full of Messages",
  "When the Chat Would Not Sleep",
  "That Crowded Day",
  "All the Words at Once",
  "The Loudest Day",
];

const TENDER_TITLES = [
  "Soft Words",
  "Quiet Affection",
  "Close to the Heart",
  "Gentle Lines",
];

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
  const usedTitles = new Set<string>();

  const pushUnique = (idea: ChapterIdea) => {
    let title = idea.title;
    let n = 2;
    while (usedTitles.has(title)) {
      title = `${idea.title} (${n})`;
      n += 1;
    }
    usedTitles.add(title);
    ideas.push({ ...idea, title });
  };

  pushUnique({
    title: "The Beginning",
    startAt: messages[0].at,
    endAt: messages[Math.min(20, messages.length - 1)].at,
    tone: "opening",
  });

  const byDay = new Map<string, ParsedMessage[]>();
  for (const m of messages) {
    const key = toDayKey(m.at);
    const list = byDay.get(key) ?? [];
    list.push(m);
    byDay.set(key, list);
  }

  const sortedDays = [...byDay.entries()]
    .map(([day, dayMessages]) => ({
      day,
      dayMessages,
      story: windowStoryScore(dayMessages),
      volume: dayMessages.length,
    }))
    // Prefer days with real story texture, not just logistics pile-ons
    .sort((a, b) => b.story - a.story || b.volume - a.volume)
    .filter((d) => d.story > 0 || d.volume >= 40);

  sortedDays.slice(0, 5).forEach(({ day, dayMessages }, i) => {
    const { startAt, endAt } = dayBounds(dayMessages);
    pushUnique({
      title: `${BUSY_TITLES[i % BUSY_TITLES.length]} · ${formatDayKeyDMY(day)}`,
      startAt,
      endAt,
      tone: "high-energy",
    });
  });

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
  if (gapIndex > 0 && maxGap >= 3) {
    pushUnique({
      title: "The Long Pause",
      startAt: messages[gapIndex - 1].at,
      endAt: messages[gapIndex].at,
      tone: "reflective",
    });
  }

  const affectionPattern = /\b(love|miss|sorry|hugs?|kiss|heart|care|proud)\b/i;
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
  sortedKeywordDays.slice(0, 4).forEach(([day, dayMessages], i) => {
    const { startAt, endAt } = dayBounds(dayMessages);
    pushUnique({
      title: `${TENDER_TITLES[i % TENDER_TITLES.length]} · ${formatDayKeyDMY(day)}`,
      startAt,
      endAt,
      tone: "warm",
    });
  });

  pushUnique({
    title: "Where We Are Now",
    startAt: messages[Math.max(0, messages.length - 21)].at,
    endAt: messages[messages.length - 1].at,
    tone: "closing",
  });

  ideas.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  return ideas.slice(0, max);
}
