import { computeStats } from "@/lib/scanner/stats";
import {
  buildWindows,
  proposeChaptersFromScan,
  type ChapterIdea,
} from "@/lib/scanner/windows";
import type { ParsedMessage } from "@/lib/parser/types";
import type { RelationshipId } from "@/lib/relationships";
import { formatDayKeyDMY } from "@/lib/format-date";
import type {
  BookPageModel,
  GenerateBookInput,
  GeneratedBook,
  QuoteModel,
} from "./types";

function noEmDash(text: string): string {
  return text.replace(/\u2014/g, ",").replace(/ -- /g, ", ");
}

function dayKey(d: Date): string {
  return formatDayKeyDMY(
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
  );
}

export function messagesInRange(
  messages: ParsedMessage[],
  startAt: Date,
  endAt: Date,
): ParsedMessage[] {
  const start = startAt.getTime();
  const end = endAt.getTime();
  return messages.filter((m) => {
    const t = m.at.getTime();
    return t >= start && t <= end;
  });
}

function isBadQuote(body: string): boolean {
  const t = body.trim();
  if (t.length < 12) return true;
  if (t.length > 280) return true;
  if (/https?:\/\//i.test(t)) return true;
  if (/maps\.google|goo\.gl\/maps|maps\.app\.goo/i.test(t)) return true;
  if (/^location:\s*/i.test(t)) return true;
  if (/<media omitted>|image omitted|video omitted|audio omitted|sticker omitted|document omitted|gif omitted/i.test(t))
    return true;
  if (/^[\d\s.,+\-°]+$/.test(t)) return true;
  // Mostly coordinates / numbers
  const letters = (t.match(/\p{L}/gu) || []).length;
  if (letters < 8) return true;
  return false;
}

function quoteScore(body: string): number {
  let score = Math.min(body.length, 160);
  if (/[❤️😍🥰😊😂😭]|love|miss|sorry|thank|happy|proud|care/i.test(body)) {
    score += 40;
  }
  if (/\?$/.test(body.trim())) score += 10;
  return score;
}

export function pickQuotes(messages: ParsedMessage[], limit = 3): QuoteModel[] {
  const usable = messages
    .filter((m) => !m.deleted && !isBadQuote(m.body))
    .sort((a, b) => quoteScore(b.body) - quoteScore(a.body));

  const picked: QuoteModel[] = [];
  const seen = new Set<string>();
  for (const m of usable) {
    const key = m.body.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push({
      text: m.body.trim(),
      author: m.author,
      at: m.at.toISOString(),
    });
    if (picked.length >= limit) break;
  }
  return picked;
}

function narrationFor(
  personA: string,
  personB: string,
  title: string,
  quoteCount: number,
  thin: boolean,
  relationship: RelationshipId,
  keyword?: string,
  firstQuote?: string,
): string {
  const detail = firstQuote
    ? `One line stays close: "${firstQuote.slice(0, 90)}${firstQuote.length > 90 ? "…" : ""}".`
    : "";
  const names = `${personA} and ${personB}`;

  if (relationship === "tribute") {
    return noEmDash(
      thin
        ? `${title}. Only a handful of lines remain from this stretch. We leave them untouched. ${detail || "What they typed is enough."} The page holds what the chat still knows.`
        : `${title}. Their words are still here, ordinary and exact. ${detail} We do not invent what the chat does not show. Reading them now feels like standing in a room they left the light on in.`,
    );
  }
  if (relationship === "friends") {
    return noEmDash(
      thin
        ? `${title}. The chat thins out for a while. ${names} leave small check-ins, half jokes, and the kind of care that never needs a speech. ${detail || "Even the quiet days belong."}`
        : `${title}. This is the ordinary care between ${names}: the forwards, the late replies, the "you free?" that meant more than it looked. ${detail || "Friendship lives in the unremarkable messages."} The quotes below are the proof.`,
    );
  }
  if (thin) {
    return noEmDash(
      `${title}. Around here the chat grows quiet. ${names} leave only a few lines, then space. ${detail || "Silence can be part of loving someone too."} We keep the thin places as carefully as the loud ones.`,
    );
  }
  if (keyword && firstQuote?.toLowerCase().includes(keyword.toLowerCase())) {
    return noEmDash(
      `${title}. You can hear "${keyword}" in the way they write to each other, not as decoration, as habit. ${detail} Between the late messages and the small replies, something settles. The lines that follow are theirs, kept exactly.`,
    );
  }
  if (quoteCount === 0) {
    return noEmDash(
      `${title}. ${names} keep writing through the ordinary days: plans, check-ins, nothing theatrical. That is what makes it tender. A book like this is built from the messages nobody thought to save.`,
    );
  }
  return noEmDash(
    `${title}. Between the late messages and the small replies, something settles between ${names}. ${detail || "A joke lands. A worry softens. Someone says goodnight twice."} The page makes room for their words next, without polishing them.`,
  );
}

export function resolveChapters(input: GenerateBookInput): ChapterIdea[] {
  if (input.aiChooses || input.chapters.length === 0) {
    return proposeChaptersFromScan(input.chat, 15);
  }
  return input.chapters.slice(0, 15);
}

export async function generateBook(
  input: GenerateBookInput,
): Promise<GeneratedBook> {
  const { personA, personB, chat, keyword } = input;
  const relationship = input.relationship || "couple";
  const chapters = resolveChapters(input);
  const windows = buildWindows(input.chat, input.specialDates);
  const stats = computeStats(chat, keyword || undefined);

  const titleOptions = [
    keyword
      ? `${personA} & ${personB}: ${keyword}`
      : `${personA} & ${personB}`,
    relationship === "tribute" ? `In Memory` : `A Story in Messages`,
    keyword ? `Built around “${keyword}”` : `Our ChatStory`,
  ].map(noEmDash);

  const title = titleOptions[0];
  const dedication = noEmDash(
    relationship === "tribute"
      ? `For ${personA} and ${personB}, and the messages that remain.`
      : keyword
        ? `For ${personA} and ${personB}, and every time you said ${keyword}.`
        : `For ${personA} and ${personB}, and every ordinary night that became something more.`,
  );

  const pages: BookPageModel[] = [
    { type: "cover", title },
    { type: "dedication", text: dedication },
  ];

  const timeline: { at: string; label: string }[] = [];

  for (const chapter of chapters) {
    let windowMessages = messagesInRange(
      chat.messages,
      chapter.startAt,
      chapter.endAt,
    );

    if (windowMessages.length === 0) {
      const match = windows.find((w) => w.label === chapter.title);
      if (match) windowMessages = match.messages;
    }

    const quotes = pickQuotes(windowMessages, 3);
    const thin = windowMessages.length < 5;
    pages.push({
      type: "chapter",
      title: chapter.title,
      narration: narrationFor(
        personA,
        personB,
        chapter.title,
        quotes.length,
        thin,
        relationship,
        keyword,
        quotes[0]?.text,
      ),
      quotes,
      milestone:
        windowMessages.length > 0
          ? `${windowMessages.length} messages in this chapter`
          : undefined,
      startAt: chapter.startAt.toISOString(),
      endAt: chapter.endAt.toISOString(),
    });
    timeline.push({
      at: dayKey(chapter.startAt),
      label: chapter.title,
    });
  }

  for (const w of windows) {
    if (w.messages.length === 0) continue;
    if (pages.some((p) => p.type === "chapter" && p.title === w.label)) continue;
    if (pages.filter((p) => p.type === "chapter").length >= 15) break;
    const quotes = pickQuotes(w.messages, 2);
    pages.push({
      type: "chapter",
      title: w.label,
      narration: narrationFor(
        personA,
        personB,
        w.label,
        quotes.length,
        w.messages.length < 5,
        relationship,
        keyword,
        quotes[0]?.text,
      ),
      quotes,
      milestone: `${w.messages.length} messages around this day`,
      startAt: w.startAt.toISOString(),
      endAt: w.endAt.toISOString(),
    });
    timeline.push({ at: dayKey(w.startAt), label: w.label });
  }

  const daysTogether = Math.max(
    1,
    Math.ceil(
      (stats.lastAt.getTime() - stats.firstAt.getTime()) /
        (24 * 60 * 60 * 1000),
    ) + 1,
  );

  pages.push({
    type: "numbers",
    totalMessages: stats.totalMessages,
    daysTogether,
    longestSilenceDays: stats.longestSilenceDays,
    mostActiveDay: stats.mostActiveDay,
    keyword: stats.keyword,
    keywordCount: stats.keywordCount,
  });

  pages.push({ type: "timeline", events: timeline });

  return { title, titleOptions, dedication, pages };
}

export async function regenerateChapter(
  input: GenerateBookInput,
  chapterTitle: string,
): Promise<BookPageModel | null> {
  const book = await generateBook(input);
  const page = book.pages.find(
    (p) => p.type === "chapter" && p.title === chapterTitle,
  );
  return page ?? null;
}
