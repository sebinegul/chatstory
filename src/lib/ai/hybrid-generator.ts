import { computeStats } from "@/lib/scanner/stats";
import { buildWindows } from "@/lib/scanner/windows";
import { relationshipVoice } from "@/lib/relationships";
import { formatDayKeyDMY } from "@/lib/format-date";
import {
  FREE_MODEL,
  STORY_MODEL,
  hasOpenRouterKey,
  openRouterChat,
  parseJsonFromModel,
} from "./openrouter";
import {
  generateBook as mockGenerateBook,
  messagesInRange,
  pickQuotes,
  resolveChapters,
} from "./mock-generator";
import type { BookPageModel, GenerateBookInput, GeneratedBook } from "./types";

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
): Promise<TitlePayload> {
  const voice = relationshipVoice(input.relationship || "couple");
  const raw = await openRouterChat({
    model: FREE_MODEL,
    system: `You name intimate keepsake books from real WhatsApp chats.
Voice: ${voice}
The title should feel like a private dedication someone would emboss on a cover, not a blog headline.
Rules: no em dashes, no cringe, no invented facts, no exclamation marks.
Return JSON only:
{"titleOptions":["...","...","..."],"dedication":"..."}`,
    user: `People: ${input.personA} and ${input.personB}
Relationship: ${input.relationship}
Celebrate keyword (emotional through-line): "${input.keyword || "none"}"
Suggest 3 short book titles (3-6 words) and one soft dedication line that could make someone pause.`,
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
): Promise<StoryPayload> {
  const voice = relationshipVoice(input.relationship || "couple");
  const raw = await openRouterChat({
    model: STORY_MODEL,
    system: `You write intimate chapter openings for a printed keepsake made from a real WhatsApp chat.

This is not a summary. It is the soft voice between the quotes. The reader should feel closeness, longing, humor, or quiet care.

Voice: ${voice}

Write 4-6 sentences per chapter (about 80-140 words). Vary rhythm: one short line, then a longer one. End in a way that opens onto the quotes that follow.

Hard rules:
- No em dashes
- Never invent quotes, dates, events, or feelings the samples do not support
- Name concrete details from the samples: a phrase they used, a time of night, a joke, a habit, a silence, a place, a pet name
- Do not repeat the upcoming quotes verbatim
- When samples are thin, still write 3 careful sentences about what little remains
- Banned phrases: journey, tapestry, delve, testament, cherished memories, in today's world, forever etched, whirlwind, soulmate (unless they said it)
- Celebrate keyword "${input.keyword || ""}" only when samples support it. Weave it naturally once at most
- Prefer warmth over drama. Prefer specificity over adjectives

Return JSON only: {"chapters":[{"title":"...","narration":"..."}]}`,
    user: JSON.stringify({
      personA: input.personA,
      personB: input.personB,
      relationship: input.relationship,
      celebrateKeyword: input.keyword || "",
      chapters: chapters.map((c) => ({
        title: c.title,
        upcomingQuotes: c.quotes.slice(0, 3),
        sampleLines: c.sample.slice(0, 24),
      })),
    }),
    temperature: 0.78,
  });
  return parseJsonFromModel<StoryPayload>(raw);
}

export async function generateBookWithModels(
  input: GenerateBookInput,
): Promise<GeneratedBook> {
  if (!hasOpenRouterKey()) {
    return mockGenerateBook(input);
  }

  try {
    const relationship = input.relationship || "couple";
    const chapterIdeas = resolveChapters(input);
    const windows = buildWindows(input.chat, input.specialDates);
    const stats = computeStats(input.chat, input.keyword || undefined);

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
      const free = await freeTitlesAndDedication(input);
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
    let narrationByTitle = new Map<string, string>();
    try {
      const story = await storyNarrations(
        input,
        prepared.map((p) => ({
          title: p.chapter.title,
          quotes: p.quotes.map((q) => q.text),
          sample: p.sample,
        })),
      );
      for (const c of story.chapters || []) {
        if (c.title && c.narration) {
          narrationByTitle.set(c.title, noEmDash(c.narration));
        }
      }
    } catch (err) {
      console.warn("Story model failed, falling back chapter narrations", err);
      const mock = await mockGenerateBook(input);
      for (const p of mock.pages) {
        if (p.type === "chapter") narrationByTitle.set(p.title, p.narration);
      }
    }

    const title = titleOptions[0];
    const pages: BookPageModel[] = [
      { type: "cover", title },
      { type: "dedication", text: dedication },
    ];

    const timeline: { at: string; label: string }[] = [];

    for (const p of prepared) {
      const fallback = (
        await mockGenerateBook({
          ...input,
          aiChooses: false,
          chapters: [p.chapter],
        })
      ).pages.find((x) => x.type === "chapter");
      const narration =
        narrationByTitle.get(p.chapter.title) ||
        (fallback && fallback.type === "chapter" ? fallback.narration : "");

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
          const one = await storyNarrations(input, [
            {
              title: w.label,
              quotes: quotes.map((q) => q.text),
              sample: w.messages.slice(0, 12).map((m) => `${m.author}: ${m.body}`),
            },
          ]);
          narration = noEmDash(one.chapters?.[0]?.narration || "");
        } catch {
          narration = noEmDash(
            `${w.label} gathers the messages around this day for ${input.personA} and ${input.personB}.`,
          );
        }
      }
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
      keyword: stats.keyword,
      keywordCount: stats.keywordCount,
    });
    pages.push({ type: "timeline", events: timeline });

    void relationship;
    return { title, titleOptions, dedication, pages };
  } catch (err) {
    console.error("OpenRouter generation failed, using mock", err);
    return mockGenerateBook(input);
  }
}
