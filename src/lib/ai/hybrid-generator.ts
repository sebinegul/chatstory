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
import { isBadQuote, isMeaningfulQuote } from "./quotes";
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
/** Small batches = fewer JSON failures / timeouts on free models. */
const STORY_BATCH = 2;

function normalizeTitle(t: string): string {
  return t.trim().toLowerCase().replace(/\s+/g, " ");
}

async function freeTitlesAndDedication(
  input: GenerateBookInput,
  lang: DetectedLanguage,
): Promise<TitlePayload> {
  const relationship = input.relationship || "couple";
  const raw = await openRouterChat({
    model: FREE_MODEL,
    fallbacks: FREE_MODEL_CANDIDATES,
    maxAttempts: 3,
    timeoutMs: 30_000,
    json: true,
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

async function storyNarrationsBatch(
  input: GenerateBookInput,
  chapters: { title: string; quotes: string[]; sample: string[] }[],
  lang: DetectedLanguage,
  system: string,
): Promise<{ title: string; narration: string }[]> {
  const relationship = input.relationship || "couple";
  const raw = await openRouterChat({
    model: STORY_MODEL,
    fallbacks: STORY_MODEL_CANDIDATES,
    maxAttempts: 3,
    timeoutMs: 50_000,
    json: true,
    system,
    user: JSON.stringify({
      people: peopleLabelForBook(relationship, input.personA, input.personB),
      personA: input.personA,
      personB: input.personB,
      relationship,
      language: lang.label,
      writeIn: lang.writeIn,
      instruction:
        "Write memoir-style openings. Do not summarize. Do not paste samples. Quotes are shown separately.",
      chapters: chapters.map((c) => ({
        title: c.title,
        upcomingQuotes: c.quotes.slice(0, 3),
        sampleLines: c.sample.slice(0, 12),
      })),
    }),
    temperature: 0.7,
  });
  const parsed = parseJsonFromModel<StoryPayload>(raw);
  return (parsed.chapters || []).filter((c) => c?.title && c?.narration);
}

async function storyNarrations(
  input: GenerateBookInput,
  chapters: { title: string; quotes: string[]; sample: string[] }[],
  lang: DetectedLanguage,
): Promise<StoryPayload> {
  const system = buildChapterNarrationSystem({
    relationship: input.relationship || "couple",
    languageBlock: languagePromptBlock(lang),
    writeIn: lang.writeIn,
  });
  const merged: { title: string; narration: string }[] = [];

  for (let i = 0; i < chapters.length; i += STORY_BATCH) {
    const batch = chapters.slice(i, i + STORY_BATCH);
    try {
      const got = await storyNarrationsBatch(input, batch, lang, system);
      if (got.length > 0) {
        merged.push(...got);
        continue;
      }
      throw new Error("Empty chapters array from model");
    } catch (err) {
      console.warn(
        `[chatstory] story batch failed (${batch.map((c) => c.title).join(", ")}), retrying one-by-one`,
        err instanceof Error ? err.message : err,
      );
      for (const chapter of batch) {
        try {
          const one = await storyNarrationsBatch(
            input,
            [chapter],
            lang,
            system,
          );
          if (one[0]?.narration) merged.push(one[0]);
        } catch (oneErr) {
          console.warn(
            `[chatstory] story chapter failed: ${chapter.title}`,
            oneErr instanceof Error ? oneErr.message : oneErr,
          );
        }
      }
    }
  }

  return { chapters: merged };
}

function assignNarrations(
  prepared: { chapter: { title: string } }[],
  storyChapters: { title: string; narration: string }[],
): { byIndex: string[]; byTitle: Map<string, string>; aiHits: number } {
  const byIndex: string[] = [];
  const byTitle = new Map<string, string>();
  const unused = [...storyChapters];

  for (let i = 0; i < prepared.length; i++) {
    const want = normalizeTitle(prepared[i].chapter.title);
    const exact = unused.findIndex((c) => normalizeTitle(c.title) === want);
    if (exact >= 0) {
      const [hit] = unused.splice(exact, 1);
      const text = noEmDash(String(hit.narration));
      byIndex[i] = text;
      byTitle.set(prepared[i].chapter.title, text);
      byTitle.set(hit.title.trim(), text);
      continue;
    }
    // Fuzzy: title contained / contains
    const fuzzy = unused.findIndex((c) => {
      const got = normalizeTitle(c.title);
      return got.includes(want) || want.includes(got);
    });
    if (fuzzy >= 0) {
      const [hit] = unused.splice(fuzzy, 1);
      const text = noEmDash(String(hit.narration));
      byIndex[i] = text;
      byTitle.set(prepared[i].chapter.title, text);
    }
  }

  // Remaining by order into empty slots
  for (let i = 0; i < prepared.length && unused.length > 0; i++) {
    if (byIndex[i]) continue;
    const hit = unused.shift()!;
    const text = noEmDash(String(hit.narration));
    byIndex[i] = text;
    byTitle.set(prepared[i].chapter.title, text);
  }

  const aiHits = byIndex.filter(Boolean).length;
  return { byIndex, byTitle, aiHits };
}

export async function generateBookWithModels(
  input: GenerateBookInput,
): Promise<GeneratedBook> {
  const notes: string[] = [];
  if (!hasOpenRouterKey()) {
    notes.push("OPENROUTER_API_KEY missing — template voice only");
    const mock = await mockGenerateBook(input);
    return {
      ...mock,
      generation: {
        hasOpenRouterKey: false,
        storyModel: STORY_MODEL,
        aiTitle: false,
        aiChapters: 0,
        chapterCount: mock.pages.filter((p) => p.type === "chapter").length,
        usedAi: false,
        notes,
      },
    };
  }

  try {
    const relationship = input.relationship || "couple";
    const lang = detectChatLanguage(input.chat);
    const chapterIdeas = resolveChapters(input).slice(0, MAX_AI_CHAPTERS);
    const windows = buildWindows(input.chat, input.specialDates);
    const stats = computeStats(input.chat, undefined);

    const prepared = chapterIdeas
      .map((chapter) => {
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
        const meaningful = windowMessages.filter(
          (m) => !m.deleted && isMeaningfulQuote(m.body),
        );
        const sampleSource =
          meaningful.length >= 3
            ? meaningful
            : windowMessages.filter((m) => !m.deleted && !isBadQuote(m.body));
        return {
          chapter,
          windowMessages,
          quotes,
          sample: sampleSource
            .slice(0, 16)
            .map((m) => `${m.author}: ${m.body}`),
        };
      })
      .filter((p) => {
        if (p.quotes.length >= 2) return true;
        return (
          p.chapter.tone === "opening" || p.chapter.tone === "closing"
        );
      })
      .slice(0, MAX_AI_CHAPTERS);

    // Free model: titles + dedication
    let titleOptions: string[];
    let dedication: string;
    let aiTitle = false;
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
      aiTitle = free.titleOptions.length >= 1 && Boolean(free.dedication);
      if (!aiTitle) notes.push("Title model returned incomplete JSON");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      notes.push(`Title model failed: ${msg.slice(0, 160)}`);
      console.warn("Free model failed, using mock titles", err);
      const mock = await mockGenerateBook(input);
      titleOptions = mock.titleOptions;
      dedication = mock.dedication;
      aiTitle = false;
    }

    // Story model: main narrations only
    const narrationsByIndex: string[] = [];
    let narrationByTitle = new Map<string, string>();
    let aiHits = 0;
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
      const assigned = assignNarrations(prepared, story.chapters || []);
      assigned.byIndex.forEach((text, i) => {
        if (text) narrationsByIndex[i] = text;
      });
      narrationByTitle = assigned.byTitle;
      aiHits = assigned.aiHits;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      notes.push(`Story model failed: ${msg.slice(0, 160)}`);
      console.warn("Story model failed, falling back chapter narrations", err);
    }

    if (aiHits === 0 && prepared.length > 0) {
      notes.push(
        "Zero AI chapter narrations — template fallback voice used. Check model rate limits / OPENROUTER_STORY_MODEL.",
      );
      console.warn(
        "[chatstory] zero AI narrations — PDF will use template fallback voice. Check OPENROUTER_API_KEY / OPENROUTER_STORY_MODEL and Vercel logs.",
      );
    } else {
      console.info(
        `[chatstory] AI narrations ${aiHits}/${prepared.length} (model=${STORY_MODEL})`,
      );
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
    return {
      title,
      titleOptions,
      dedication,
      pages,
      generation: {
        hasOpenRouterKey: true,
        storyModel: STORY_MODEL,
        aiTitle,
        aiChapters: aiHits,
        chapterCount: pages.filter((p) => p.type === "chapter").length,
        usedAi: aiTitle || aiHits > 0,
        notes,
      },
    };
  } catch (err) {
    console.error("OpenRouter generation failed, using mock", err);
    const msg = err instanceof Error ? err.message : String(err);
    const mock = await mockGenerateBook(input);
    return {
      ...mock,
      generation: {
        hasOpenRouterKey: hasOpenRouterKey(),
        storyModel: STORY_MODEL,
        aiTitle: false,
        aiChapters: 0,
        chapterCount: mock.pages.filter((p) => p.type === "chapter").length,
        usedAi: false,
        notes: [`Fatal generate error: ${msg.slice(0, 200)}`],
      },
    };
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
