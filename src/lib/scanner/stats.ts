import type { ParsedChat } from "@/lib/parser/types";
import { formatDayKeyDMY } from "@/lib/format-date";

export interface ChatStats {
  totalMessages: number;
  firstAt: Date;
  lastAt: Date;
  longestSilenceDays: number;
  mostActiveDay: string; // dd/mm/yyyy for display
  mostActiveDayKey: string; // YYYY-MM-DD
  keyword: string;
  keywordCount: number;
  suggestedKeyword: string;
  topKeywords: { word: string; count: number }[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

const STOP = new Set(
  [
    "the", "a", "an", "and", "or", "but", "if", "in", "on", "at", "to", "for",
    "of", "is", "it", "this", "that", "with", "from", "as", "be", "are", "was",
    "were", "been", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "can", "may", "might", "must", "i", "me", "my", "we",
    "you", "your", "he", "she", "they", "them", "their", "our", "us", "not",
    "no", "yes", "ok", "okay", "so", "just", "like", "what", "when", "where",
    "who", "why", "how", "all", "any", "some", "than", "then", "there", "here",
    "out", "up", "down", "about", "into", "over", "after", "before", "also",
    "too", "very", "really", "get", "got", "go", "going", "gone", "come",
    "came", "see", "saw", "know", "think", "want", "need", "let", "now",
    "today", "tomorrow", "yesterday", "lol", "haha", "hahaha", "omg", "idk",
    "imo", "btw", "nah", "yea", "yeah", "yep", "nope", "hmm", "hi", "hey",
    "hello", "bye", "good", "morning", "night", "please", "thanks", "thank",
    "media", "omitted", "message", "deleted", "edited", "https", "http", "www",
    "null", "undefined",
  ].map((w) => w.toLowerCase()),
);

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

function tokenize(body: string): string[] {
  return body
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{L}\p{N}\s'_-]/gu, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

/** Find the most repeated meaningful tokens in the chat. */
export function findTopKeywords(
  chat: ParsedChat,
  limit = 8,
): { word: string; count: number }[] {
  const nameParts = new Set(
    chat.participants
      .flatMap((p) => p.toLowerCase().split(/\s+/))
      .filter((p) => p.length > 1),
  );
  const counts = new Map<string, number>();

  for (const m of chat.messages) {
    if (m.deleted) continue;
    const seenInMessage = new Set<string>();
    for (const raw of tokenize(m.body)) {
      if (raw.length < 3) continue;
      if (STOP.has(raw)) continue;
      if (nameParts.has(raw)) continue;
      if (/^\d+$/.test(raw)) continue;
      if (seenInMessage.has(raw)) continue;
      seenInMessage.add(raw);
      counts.set(raw, (counts.get(raw) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .filter((x) => x.count >= 2)
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, limit);
}

export function countKeyword(chat: ParsedChat, keyword: string): number {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return 0;
  return chat.messages.filter((m) => m.body.toLowerCase().includes(kw)).length;
}

export function computeStats(chat: ParsedChat, keyword?: string): ChatStats {
  const topKeywords = findTopKeywords(chat);
  const suggestedKeyword = topKeywords[0]?.word || "";
  const kw = (keyword ?? "").trim() || suggestedKeyword;
  const mostActiveDayKey = computeMostActiveDay(chat.messages);

  return {
    totalMessages: chat.messages.length,
    firstAt: chat.firstAt,
    lastAt: chat.lastAt,
    longestSilenceDays: computeLongestSilenceDays(chat.messages),
    mostActiveDay: formatDayKeyDMY(mostActiveDayKey),
    mostActiveDayKey,
    keyword: kw,
    keywordCount: countKeyword(chat, kw),
    suggestedKeyword,
    topKeywords,
  };
}
