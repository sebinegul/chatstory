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

function clip(s: string, n: number): string {
  const t = s.trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n).trim()}…`;
}

function hourHint(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const h = d.getHours();
  if (h < 5) return "in the small hours";
  if (h < 11) return "in the morning";
  if (h < 17) return "through the afternoon";
  if (h < 21) return "in the evening";
  return "late at night";
}

/** Unique, quote-grounded narration — never the same boilerplate on every page. */
export function narrationForChapter(opts: {
  personA: string;
  personB: string;
  title: string;
  relationship: RelationshipId;
  quotes: QuoteModel[];
  messageCount: number;
  chapterIndex: number;
}): string {
  const {
    personA,
    personB,
    title,
    relationship,
    quotes,
    messageCount,
    chapterIndex,
  } = opts;
  const names = `${personA} and ${personB}`;
  const q0 = quotes[0];
  const q1 = quotes[1];
  const thin = messageCount < 5;
  const when = hourHint(q0?.at);
  const who = q0?.author || personA;
  const line = q0 ? clip(q0.text, 88) : "";
  const second = q1 ? clip(q1.text, 64) : "";
  const countBit =
    messageCount > 0
      ? `${messageCount.toLocaleString("en-IN")} messages sit in this stretch.`
      : "Only a few lines remain here.";

  const openings = [
    `${title} opens like a door left ajar.`,
    `In ${title}, the chat finds its own weather.`,
    `${title} holds what ${names} typed when nobody was watching.`,
    `Here, under ${title}, the thread keeps breathing.`,
    `${title} is not a speech. It is a pile of small returns.`,
  ];
  const open = openings[chapterIndex % openings.length];

  if (relationship === "tribute") {
    return noEmDash(
      thin
        ? `${open} Only a handful of lines remain. We leave them untouched. ${line ? `${who} wrote: "${line}".` : "What they typed is enough."} The page keeps what the chat still knows.`
        : `${open} Their words are still here, ordinary and exact. ${line ? `One line stays close, from ${who}${when ? ` ${when}` : ""}: "${line}".` : ""} ${countBit} We do not invent what the chat does not show.`,
    );
  }

  if (relationship === "friends") {
    if (thin) {
      return noEmDash(
        `${open} The thread thins for a while. ${names} leave check-ins and half jokes. ${line ? `${who} said "${line}".` : "Even the quiet days belong."} Friendship often looks like this: light on the surface, steady underneath.`,
      );
    }
    const variants = [
      `${open} Between ${names}, care shows up as check-ins and shared plans — not romance, friendship. ${line ? `${who}${when ? ` ${when}` : ""} typed "${line}".` : ""} ${second ? `Then another beat: "${second}".` : ""} ${countBit} The quotes below are theirs, kept exactly.`,
      `${open} This chapter is the closeness of friends who keep showing up. ${line ? `Listen to ${who}: "${line}".` : ""} ${countBit} Nothing theatrical. That is the point.`,
      `${open} ${names} keep the thread warm without announcing it. ${line ? `One line from ${who} stays: "${line}".` : ""} ${second ? `Another answers in its own way: "${second}".` : ""} ${countBit}`,
    ];
    return noEmDash(variants[chapterIndex % variants.length]);
  }

  if (relationship === "family" || relationship === "siblings") {
    return noEmDash(
      thin
        ? `${open} The messages grow sparse. ${names} still leave small check-ins. ${line ? `${who} wrote "${line}".` : ""} Kinship does not need a full page every day.`
        : `${open} Across these days, ${names} keep the ordinary care of family: updates, worries, soft teasing. ${line ? `${who}${when ? ` ${when}` : ""} said "${line}".` : ""} ${countBit} The next lines are the proof.`,
    );
  }

  // couple / default
  if (thin) {
    return noEmDash(
      `${open} Around here the chat grows quiet. ${names} leave only a few lines, then space. ${line ? `Still, ${who} left this: "${line}".` : "Silence can be part of loving someone too."} We keep the thin places as carefully as the loud ones.`,
    );
  }
  if (!q0) {
    return noEmDash(
      `${open} ${names} keep writing through ordinary days: plans, check-ins, nothing theatrical. ${countBit} A book like this is built from the messages nobody thought to save.`,
    );
  }

  const coupleVariants = [
    `${open} Between the late messages and the small replies, something settles between ${names}. ${who}${when ? ` ${when}` : ""} wrote "${line}". ${second ? `Then "${second}".` : ""} ${countBit} The lines below stay unpolished on purpose.`,
    `${open} This stretch belongs to the quiet ways ${names} stayed near each other. ${who} left "${line}". ${countBit} Nothing here is invented. Everything here was typed.`,
    `${open} Read slowly. ${who}${when ? ` ${when}` : ""} said "${line}". ${second ? `${q1?.author || personB} answered in kind: "${second}".` : ""} ${countBit} The page makes room for what followed.`,
  ];
  return noEmDash(coupleVariants[chapterIndex % coupleVariants.length]);
}

/** @deprecated use narrationForChapter */
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
  return narrationForChapter({
    personA,
    personB,
    title,
    relationship,
    quotes: firstQuote
      ? [{ text: firstQuote, author: personA, at: new Date().toISOString() }]
      : [],
    messageCount: thin ? 2 : Math.max(quoteCount * 8, 12),
    chapterIndex: 0,
  });
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
  const { personA, personB, chat } = input;
  const relationship = input.relationship || "couple";
  const chapters = resolveChapters(input);
  const windows = buildWindows(input.chat, input.specialDates);
  const stats = computeStats(chat, undefined);

  const titleOptions = [
    `${personA} & ${personB}`,
    relationship === "tribute" ? `In Memory` : `A Story in Messages`,
    `Our ChatStory`,
  ].map(noEmDash);

  const title = titleOptions[0];
  const dedication = noEmDash(
    relationship === "tribute"
      ? `For ${personA} and ${personB}, and the messages that remain.`
      : relationship === "friends"
        ? `For ${personA} and ${personB}, and every ordinary check-in that meant stay.`
        : relationship === "family" || relationship === "siblings"
          ? `For ${personA} and ${personB}, and the care that never needed a speech.`
          : `For ${personA} and ${personB}, and every ordinary night that became something more.`,
  );

  const pages: BookPageModel[] = [
    { type: "cover", title },
    { type: "dedication", text: dedication },
  ];

  const timeline: { at: string; label: string }[] = [];
  let chapterIndex = 0;

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
    pages.push({
      type: "chapter",
      title: chapter.title,
      narration: narrationForChapter({
        personA,
        personB,
        title: chapter.title,
        relationship,
        quotes,
        messageCount: windowMessages.length,
        chapterIndex: chapterIndex++,
      }),
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
      narration: narrationForChapter({
        personA,
        personB,
        title: w.label,
        relationship,
        quotes,
        messageCount: w.messages.length,
        chapterIndex: chapterIndex++,
      }),
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
    keyword: "",
    keywordCount: 0,
  });

  pages.push({ type: "timeline", events: timeline });

  void narrationFor;
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
