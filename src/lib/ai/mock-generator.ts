import { computeStats } from "@/lib/scanner/stats";
import {
  buildWindows,
  proposeChaptersFromScan,
  type ChapterIdea,
} from "@/lib/scanner/windows";
import type { ParsedMessage } from "@/lib/parser/types";
import type { RelationshipId } from "@/lib/relationships";
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
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

export function pickQuotes(messages: ParsedMessage[], limit = 3): QuoteModel[] {
  const usable = messages
    .filter((m) => !m.deleted && m.body.trim().length > 8)
    .sort((a, b) => b.body.length - a.body.length);

  const picked: QuoteModel[] = [];
  const seen = new Set<string>();
  for (const m of usable) {
    const key = m.body.trim();
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
): string {
  if (relationship === "tribute") {
    return noEmDash(
      thin
        ? `${title} holds only a few remaining lines. We keep them as they were written.`
        : `${title} holds a few of their words. We keep them as they were written. Softly. Without adding what is not there.`,
    );
  }
  if (relationship === "friends") {
    return noEmDash(
      thin
        ? `Around ${title.toLowerCase()}, the chat thins out. ${personA} and ${personB} leave a small trail of check-ins.`
        : `${title} is a stretch of their back-and-forth. The jokes, the check-ins, the ordinary care. The lines below are theirs.`,
    );
  }
  if (thin) {
    return noEmDash(
      `Around ${title.toLowerCase()}, the chat grows quiet. ${personA} and ${personB} leave only a few lines. The silence is part of the story too.`,
    );
  }
  if (quoteCount === 0) {
    return noEmDash(
      `${personA} and ${personB} keep writing through ${title.toLowerCase()}. The messages are ordinary. That is what makes them tender.`,
    );
  }
  return noEmDash(
    `${title} holds a stretch of their conversation. The words below are theirs, kept exactly as they were typed. Between the lines, something settles into place.`,
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
    `${personA} & ${personB}`,
    relationship === "tribute" ? `In Memory` : `A Story in Messages`,
    `Our ChatStory`,
  ].map(noEmDash);

  const title = titleOptions[0];
  const dedication = noEmDash(
    relationship === "tribute"
      ? `For ${personA} and ${personB}, and the messages that remain.`
      : `For ${personA} and ${personB}, and every ordinary night that became something more.`,
  );

  const pages: BookPageModel[] = [
    { type: "cover", title, subtitle: "From a WhatsApp chat" },
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
