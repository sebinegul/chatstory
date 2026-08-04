import { computeStats } from "@/lib/scanner/stats";
import {
  buildWindows,
  proposeChaptersFromScan,
  type ChapterIdea,
} from "@/lib/scanner/windows";
import type { ParsedMessage } from "@/lib/parser/types";
import {
  peopleLabelForBook,
  type RelationshipId,
} from "@/lib/relationships";
import { formatDayKeyDMY } from "@/lib/format-date";
import { pickQuotes } from "./quotes";
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

export { pickQuotes } from "./quotes";

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

/**
 * Narration sits beside the quotes — it must not paste chat lines.
 * Quotes live in the quote boxes below.
 */
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
  const names = peopleLabelForBook(relationship, personA, personB);
  const q0 = quotes[0];
  const thin = messageCount < 5 || quotes.length < 2;
  const when = hourHint(q0?.at);
  const who = q0?.author || personA.split(",")[0]?.trim() || personA;
  const voices = [...new Set(quotes.map((q) => q.author).filter(Boolean))];
  const voiceBit =
    voices.length >= 2
      ? `${voices.slice(0, 3).join(", ")}${voices.length > 3 ? ", and others" : ""} leave the proof below.`
      : who
        ? `A line from ${who} still anchors the page.`
        : "The lines below are the proof.";

  const openings = [
    `${title} opens like a door left ajar.`,
    `In ${title}, the chat finds its own weather.`,
    `${title} holds what ${names} typed when nobody was watching.`,
    `Here, under ${title}, the thread keeps breathing.`,
    `${title} is not a speech. It is a pile of small returns.`,
  ];
  const open = openings[chapterIndex % openings.length];

  if (relationship === "group") {
    if (thin) {
      return noEmDash(
        `${open} This stretch is thin on keepsake moments. We leave it short rather than invent meaning. ${voiceBit}`,
      );
    }
    const variants = [
      `${open} The group was loud here — banter, plans, and whoever jumped in. The memory is not the logistics; it is how they stayed tangled in the same thread${when ? ` ${when}` : ""}. ${voiceBit}`,
      `${open} Among ${names}, the chat piled on without polishing itself. What worth keeping sits in the quotes below, not retold as a summary.`,
      `${open} ${names} kept the night going. Narration steps aside so their own words can carry the chapter.`,
    ];
    return noEmDash(variants[chapterIndex % variants.length]);
  }

  if (relationship === "tribute") {
    return noEmDash(
      thin
        ? `${open} Only a handful of lines remain. We leave them untouched. The page keeps what the chat still knows.`
        : `${open} Their words are still here, ordinary and exact${when ? `, especially ${when}` : ""}. We do not invent what the chat does not show. ${voiceBit}`,
    );
  }

  if (relationship === "friends") {
    if (thin) {
      return noEmDash(
        `${open} The thread thins for a while. Friendship often looks like this: light on the surface, steady underneath. ${voiceBit}`,
      );
    }
    const variants = [
      `${open} Between ${names}, care shows up as check-ins and shared plans — not romance, friendship. ${voiceBit}`,
      `${open} This chapter is the closeness of friends who keep showing up. Nothing theatrical. That is the point.`,
      `${open} ${names} keep the thread warm without announcing it. ${voiceBit}`,
    ];
    return noEmDash(variants[chapterIndex % variants.length]);
  }

  if (relationship === "family" || relationship === "siblings") {
    return noEmDash(
      thin
        ? `${open} The messages grow sparse. Kinship does not need a full page every day. ${voiceBit}`
        : `${open} Across these days, ${names} keep the ordinary care of family: updates, worries, soft teasing. ${voiceBit}`,
    );
  }

  if (thin) {
    return noEmDash(
      `${open} Around here the chat grows quiet. We keep the thin places as carefully as the loud ones. ${voiceBit}`,
    );
  }
  if (!q0) {
    return noEmDash(
      `${open} ${names} keep writing through ordinary days: plans, check-ins, nothing theatrical. A book like this is built from the messages nobody thought to save.`,
    );
  }

  const coupleVariants = [
    `${open} Between the late messages and the small replies, something settles between ${names}. ${voiceBit}`,
    `${open} This stretch belongs to the quiet ways ${names} stayed near each other. Nothing here is invented. Everything here was typed.`,
    `${open} Read slowly. The page makes room for what followed — and leaves their words intact below.`,
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
  const people = peopleLabelForBook(relationship, personA, personB);
  const titleOptions = [
    relationship === "group" ? people : `${personA} & ${personB}`,
    relationship === "tribute"
      ? `In Memory`
      : relationship === "group"
        ? `The Group Chat`
        : `A Story in Messages`,
    `Our ChatStory`,
  ].map(noEmDash);

  const title = titleOptions[0];
  const dedication = noEmDash(
    relationship === "tribute"
      ? `For ${personA} and ${personB}, and the messages that remain.`
      : relationship === "group"
        ? `For ${people}, and every joke, plan, and fight the thread still remembers.`
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
    if (
      quotes.length < 2 &&
      chapter.tone !== "opening" &&
      chapter.tone !== "closing"
    ) {
      continue;
    }

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
    if (quotes.length < 1) continue;
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
