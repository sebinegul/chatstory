import { computeStats } from "@/lib/scanner/stats";
import { buildWindows } from "@/lib/scanner/windows";
import {
  relationshipStoryGuide,
  relationshipVoice,
} from "@/lib/relationships";
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

async function freeTitlesAndDedication(
  input: GenerateBookInput,
  lang: DetectedLanguage,
): Promise<TitlePayload> {
  const relationship = input.relationship || "couple";
  const voice = relationshipVoice(relationship);
  const guide = relationshipStoryGuide(relationship);
  const raw = await openRouterChat({
    model: FREE_MODEL,
    fallbacks: FREE_MODEL_CANDIDATES,
    system: `You name intimate keepsake books from real WhatsApp chats.
Voice: ${voice}
Relationship context: ${guide}
${languagePromptBlock(lang)}
The title should feel like a private dedication someone would emboss on a cover, not a blog headline.
Rules: no em dashes, no cringe, no invented facts, no exclamation marks.
Return JSON only:
{"titleOptions":["...","...","..."],"dedication":"..."}`,
    user: `People: ${input.personA} and ${input.personB}
Relationship type: ${relationship}
Detected chat language: ${lang.label}
Suggest 3 short book titles (3-6 words) and one soft dedication line that fits THIS relationship.
Write titles and dedication in ${lang.writeIn}.`,
    temperature: 0.75,
  });
  const parsed = parseJsonFromModel<TitlePayload>(raw);
  return {
    titleOptions: (parsed.titleOptions || [])
      .slice(0, 3)
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
  const voice = relationshipVoice(relationship);
  const guide = relationshipStoryGuide(relationship);
  const BATCH = 4;
  const merged: { title: string; narration: string }[] = [];

  for (let i = 0; i < chapters.length; i += BATCH) {
    const batch = chapters.slice(i, i + BATCH);
    const raw = await openRouterChat({
      model: STORY_MODEL,
      fallbacks: STORY_MODEL_CANDIDATES,
      system: `You write intimate chapter openings for a printed keepsake made from a real WhatsApp chat.

This is not a summary. It is the soft voice between the quotes — grounded only in the sample lines.

Voice: ${voice}
RELATIONSHIP (must follow): ${guide}
${languagePromptBlock(lang)}

Write like a thoughtful human friend, not a novelist. 3–5 short sentences.
Plain words. Specific, emotionally true to the samples.
Each chapter must feel different because the samples are different.

Hard rules:
- No em dashes
- Never invent quotes, dates, events, or feelings the samples do not support
- Ground at least two sentences in concrete sample details (phrase, time, joke, habit, silence)
- Do not repeat the upcoming quotes verbatim
- When samples are thin, write less — 2–3 careful sentences
- Banned phrases: journey, tapestry, delve, testament, cherished, whirlwind, soulmate (unless they said it), "ordinary care", "something settles", "the soft voice", forever etched
- Do NOT force a celebrate-word theme
- Prefer warmth over drama. Prefer specificity over adjectives
- Match the relationship type exactly (friends stay friends; couples stay partners)

Return JSON only: {"chapters":[{"title":"...","narration":"..."}]}
Use each chapter title EXACTLY as given. Return one object per chapter, in the same order.
Narration language: ${lang.writeIn}.`,
      user: JSON.stringify({
        personA: input.personA,
        personB: input.personB,
        relationship,
        language: lang.label,
        writeIn: lang.writeIn,
        chapters: batch.map((c) => ({
          title: c.title,
          upcomingQuotes: c.quotes.slice(0, 3),
          sampleLines: c.sample.slice(0, 20),
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
    const chapterIdeas = resolveChapters(input);
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
        sample: windowMessages.slice(0, 20).map((m) => `${m.author}: ${m.body}`),
      };
    });

    // Free model: titles + dedication
    let titleOptions: string[];
    let dedication: string;
    try {
      const free = await freeTitlesAndDedication(input, lang);
      titleOptions =
        free.titleOptions.length >= 1
          ? free.titleOptions
          : [`${input.personA} & ${input.personB}`];
      dedication =
        free.dedication ||
        `For ${input.personA} and ${input.personB}.`;
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
    const humanizeOpts = {
      relationship: relationship as RelationshipId,
      lang,
      personA: input.personA,
      personB: input.personB,
    };

    for (let i = 0; i < prepared.length; i++) {
      const p = prepared[i];
      let narration =
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
        });
      narration = await humanizeNarration(narration, humanizeOpts);

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

    // Special-date windows not already covered
    for (const w of windows) {
      if (w.messages.length === 0) continue;
      if (pages.some((p) => p.type === "chapter" && p.title === w.label)) continue;
      if (pages.filter((p) => p.type === "chapter").length >= 15) break;
      const quotes = pickQuotes(w.messages, 2);
      let narration = narrationByTitle.get(w.label);
      if (!narration) {
        try {
          const one = await storyNarrations(
            input,
            [
              {
                title: w.label,
                quotes: quotes.map((q) => q.text),
                sample: w.messages.slice(0, 12).map((m) => `${m.author}: ${m.body}`),
              },
            ],
            lang,
          );
          narration = noEmDash(one.chapters?.[0]?.narration || "");
        } catch {
          narration = "";
        }
      }
      if (!narration) {
        narration = narrationForChapter({
          personA: input.personA,
          personB: input.personB,
          title: w.label,
          relationship,
          quotes,
          messageCount: w.messages.length,
          chapterIndex: pages.filter((p) => p.type === "chapter").length,
        });
      }
      narration = await humanizeNarration(narration, humanizeOpts);
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
