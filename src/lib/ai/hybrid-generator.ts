import { computeStats } from "@/lib/scanner/stats";
import { buildWindows } from "@/lib/scanner/windows";
import { peopleLabelForBook } from "@/lib/relationships";
import { formatDayKeyDMY } from "@/lib/format-date";
import {
  FREE_MODEL,
  FREE_MODEL_CANDIDATES,
  STORY_MODEL,
  STORY_MODEL_CANDIDATES,
  hasOpenRouterKey,
  openRouterChat,
  parseJsonFromModel,
} from "./openrouter";
import {
  generateBook as mockGenerateBook,
  messagesInRange,
  narrationForChapter,
  pickQuotes,
  resolveChapters,
} from "./mock-generator";
import {
  detectChatLanguage,
  languagePromptBlock,
  type DetectedLanguage,
} from "./detect-language";
import { humanizeNarration } from "./humanize";
import {
  buildChapterNarrationSystem,
  buildTitleDedicationSystem,
} from "./prompts";
import type { BookPageModel, GenerateBookInput, GeneratedBook } from "./types";
import type { RelationshipId } from "@/lib/relationships";

function noEmDash(text: string): string {
  return text.replace(/\u2014/g, ",").replace(/ -- /g, ", ");
}

function dayKey(d: Date): string {
  return formatDayKeyDMY(
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
  );
}

type TitlePayload = {
  titleOptions: string[];
  dedication: string;
};

type StoryPayload = {
  chapters: { title: string; narration: string }[];
};

/** Keep AI chapter count inside Vercel function time budgets. */
const MAX_AI_CHAPTERS = 8;
const STORY_BATCH = 4;

async function freeTitlesAndDedication(
  input: GenerateBookInput,
  lang: DetectedLanguage,
): Promise<TitlePayload> {
  const relationship = input.relationship || "couple";
  const raw = await openRouterChat({
    model: FREE_MODEL,
    fallbacks: FREE_MODEL_CANDIDATES,
    maxAttempts: 2,
    timeoutMs: 25_000,
    system: buildTitleDedicationSystem({
      relationship,
      languageBlock: languagePromptBlock(lang),
    }),
    user: `People: ${peopleLabelForBook(relationship, input.personA, input.personB)}
Relationship type selected in UI: ${relationship}
Detected chat language: ${lang.label}
Suggest up to 5 short book titles and one soft dedication line that fits THIS relationship.
${relationship === "group" ? "This is a group chat chronicle — not a romance duo title." : ""}
Write titles and dedication in ${lang.writeIn}.`,
    temperature: 0.75,
  });
  const parsed = parseJsonFromModel<TitlePayload>(raw);
  return {
    titleOptions: (parsed.titleOptions || [])
      .slice(0, 5)
      .map((t) => noEmDash(String(t))),
    dedication: noEmDash(String(parsed.dedication || "")),
  };
}

async function storyNarrations(
  input: GenerateBookInput,
  chapters: { title: string; quotes: string[]; sample: string[] }[],
  lang: DetectedLanguage,
): Promise<StoryPayload> {
  const relationship = input.relationship || "couple";
  const merged: { title: string; narration: string }[] = [];
  const system = buildChapterNarrationSystem({
    relationship,
    languageBlock: languagePromptBlock(lang),
    writeIn: lang.writeIn,
  });

  for (let i = 0; i < chapters.length; i += STORY_BATCH) {
    const batch = chapters.slice(i, i + STORY_BATCH);
    const raw = await openRouterChat({
      model: STORY_MODEL,
      fallbacks: STORY_MODEL_CANDIDATES,
      maxAttempts: 2,
      timeoutMs: 45_000,
      system,
      user: JSON.stringify({
        people: peopleLabelForBook(relationship, input.personA, input.personB),
        personA: input.personA,
        personB: input.personB,
        relationship,
        language: lang.label,
        writeIn: lang.writeIn,
        chapters: batch.map((c) => ({
          title: c.title,
          upcomingQuotes: c.quotes.slice(0, 3),
          sampleLines: c.sample.slice(0, 16),
        })),
      }),
      temperature: 0.7,
    });
    const parsed = parseJsonFromModel<StoryPayload>(raw);
    for (const c of parsed.chapters || []) {
      if (c?.title && c?.narration) merged.push(c);
    }
  }

  return { chapters: merged };
}

export async function generateBookWithModels(
  input: GenerateBookInput,
): Promise<GeneratedBook> {
  if (!hasOpenRouterKey()) {
    return mockGenerateBook(input);
  }

  try {
    const relationship = input.relationship || "couple";
    const lang = detectChatLanguage(input.chat);
    const chapterIdeas = resolveChapters(input).slice(0, MAX_AI_CHAPTERS);
    const windows = buildWindows(input.chat, input.specialDates);
    const stats = computeStats(input.chat, undefined);

    const prepared = chapterIdeas.map((chapter) => {
      let windowMessages = messagesInRange(
        input.chat.messages,
        chapter.startAt,
        chapter.endAt,
      );
      if (windowMessages.length === 0) {
        const match = windows.find((w) => w.label === chapter.title);
        if (match) windowMessages = match.messages;
      }
      const quotes = pickQuotes(windowMessages, 3);
      return {
        chapter,
        windowMessages,
        quotes,
        sample: windowMessages.slice(0, 16).map((m) => `${m.author}: ${m.body}`),
      };
    });

    // Free model: titles + dedication
    let titleOptions: string[];
    let dedication: string;
    try {
      const free = await freeTitlesAndDedication(input, lang);
      const people = peopleLabelForBook(
        relationship as RelationshipId,
        input.personA,
        input.personB,
      );
      titleOptions =
        free.titleOptions.length >= 1
          ? free.titleOptions
          : relationship === "group"
            ? [people]
            : [`${input.personA} & ${input.personB}`];
      dedication =
        free.dedication ||
        (relationship === "group"
          ? `For ${people}, and every thread that kept the chat alive.`
          : `For ${input.personA} and ${input.personB}.`);
    } catch (err) {
      console.warn("Free model failed, using mock titles", err);
      const mock = await mockGenerateBook(input);
      titleOptions = mock.titleOptions;
      dedication = mock.dedication;
    }

    // Story model: main narrations only
    // Match by index first — models often rewrite titles slightly.
    const narrationsByIndex: string[] = [];
    let narrationByTitle = new Map<string, string>();
    try {
      const story = await storyNarrations(
        input,
        prepared.map((p) => ({
          title: p.chapter.title,
          quotes: p.quotes.map((q) => q.text),
          sample: p.sample,
        })),
        lang,
      );
      (story.chapters || []).forEach((c, i) => {
        if (!c?.narration) return;
        const text = noEmDash(String(c.narration));
        narrationsByIndex[i] = text;
        if (c.title) narrationByTitle.set(String(c.title).trim(), text);
        if (prepared[i]) {
          narrationByTitle.set(prepared[i].chapter.title, text);
        }
      });
    } catch (err) {
      console.warn("Story model failed, falling back chapter narrations", err);
    }

    const title = titleOptions[0];
    const pages: BookPageModel[] = [
      { type: "cover", title },
      { type: "dedication", text: dedication },
    ];

    const timeline: { at: string; label: string }[] = [];
    // humanizer.txt is already in the chapter system stack — skip a second
    // per-chapter OpenRouter pass here (that alone caused Vercel 504s).
    for (let i = 0; i < prepared.length; i++) {
      const p = prepared[i];
      const narration = noEmDash(
        narrationsByIndex[i] ||
          narrationByTitle.get(p.chapter.title) ||
          narrationForChapter({
            personA: input.personA,
            personB: input.personB,
            title: p.chapter.title,
            relationship,
            quotes: p.quotes,
            messageCount: p.windowMessages.length,
            chapterIndex: i,
          }),
      );

      pages.push({
        type: "chapter",
        title: p.chapter.title,
        narration,
        quotes: p.quotes,
        milestone:
          p.windowMessages.length > 0
            ? `${p.windowMessages.length} messages in this chapter`
            : undefined,
        startAt: p.chapter.startAt.toISOString(),
        endAt: p.chapter.endAt.toISOString(),
      });
      timeline.push({
        at: dayKey(p.chapter.startAt),
        label: p.chapter.title,
      });
    }

    // Special-date windows: local narration only (no extra model round-trips)
    for (const w of windows) {
      if (w.messages.length === 0) continue;
      if (pages.some((p) => p.type === "chapter" && p.title === w.label)) continue;
      if (pages.filter((p) => p.type === "chapter").length >= MAX_AI_CHAPTERS) break;
      const quotes = pickQuotes(w.messages, 2);
      const narration = narrationForChapter({
        personA: input.personA,
        personB: input.personB,
        title: w.label,
        relationship,
        quotes,
        messageCount: w.messages.length,
        chapterIndex: pages.filter((p) => p.type === "chapter").length,
      });
      pages.push({
        type: "chapter",
        title: w.label,
        narration,
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

    console.info(`[chatstory] language=${lang.code} (${lang.label}) relationship=${relationship}`);
    return { title, titleOptions, dedication, pages };
  } catch (err) {
    console.error("OpenRouter generation failed, using mock", err);
    return mockGenerateBook(input);
  }
}

/** Regenerate one chapter with the story model + humanize pass. */
export async function regenerateChapterWithAI(
  input: GenerateBookInput,
  chapterTitle: string,
): Promise<BookPageModel | null> {
  const relationship = input.relationship || "couple";
  const lang = detectChatLanguage(input.chat);
  const chapterIdeas = resolveChapters(input);
  const windows = buildWindows(input.chat, input.specialDates);

  const chapter =
    chapterIdeas.find((c) => c.title === chapterTitle) ||
    windows
      .filter((w) => w.label === chapterTitle)
      .map((w) => ({
        title: w.label,
        startAt: w.startAt,
        endAt: w.endAt,
      }))[0];

  let windowMessages = chapter
    ? messagesInRange(input.chat.messages, chapter.startAt, chapter.endAt)
    : [];
  if (windowMessages.length === 0) {
    const match = windows.find((w) => w.label === chapterTitle);
    if (match) windowMessages = match.messages;
  }

  const quotes = pickQuotes(windowMessages, 3);
  const sample = windowMessages
    .slice(0, 20)
    .map((m) => `${m.author}: ${m.body}`);

  let narration = "";
  if (hasOpenRouterKey()) {
    try {
      const story = await storyNarrations(
        input,
        [{ title: chapterTitle, quotes: quotes.map((q) => q.text), sample }],
        lang,
      );
      narration = noEmDash(String(story.chapters?.[0]?.narration || ""));
    } catch (err) {
      console.warn("regenerate story model failed", err);
    }
  }

  if (!narration) {
    narration = narrationForChapter({
      personA: input.personA,
      personB: input.personB,
      title: chapterTitle,
      relationship,
      quotes,
      messageCount: windowMessages.length,
      chapterIndex: 0,
    });
  }

  if (hasOpenRouterKey()) {
    narration = await humanizeNarration(narration, {
      relationship,
      lang,
      personA: input.personA,
      personB: input.personB,
    });
  }

  return {
    type: "chapter",
    title: chapterTitle,
    narration,
    quotes,
    milestone:
      windowMessages.length > 0
        ? `${windowMessages.length} messages in this chapter`
        : undefined,
    startAt: chapter?.startAt?.toISOString(),
    endAt: chapter?.endAt?.toISOString(),
  };
}
