import { existsSync, readFileSync } from "fs";
import { join } from "path";
import {
  relationshipStoryGuide,
  relationshipVoice,
  type RelationshipId,
} from "@/lib/relationships";

/** UI relationship id → prompt file under prompts/ */
export const RELATIONSHIP_PROMPT_FILES: Record<RelationshipId, string> = {
  couple: "relationship/couples.txt",
  friends: "relationship/friends.txt",
  siblings: "relationship/siblings.txt",
  family: "relationship/parents.txt",
  group: "relationship/group.txt",
  tribute: "relationship/tribute.txt",
};

/**
 * Mandatory chapter stack (always, in order):
 * 1. system.txt
 * 2. writing_rules.txt
 * 3. [optional mid-rules — chapter_generation_rules, best_practices, …]
 * 4. humanizer.txt
 * 5. <relationship>.txt  (from UI selection)
 * 6. quality_check.txt
 */
export const MANDATORY_CHAPTER_PROMPT_FILES = [
  "system.txt",
  "writing_rules.txt",
  "humanizer.txt",
  "<relationship>.txt",
  "quality_check.txt",
] as const;

const cache = new Map<string, string>();

function promptsRoot(): string {
  return join(process.cwd(), "prompts");
}

/** Load a prompt file relative to prompts/. Empty string if missing. */
export function loadPrompt(relativePath: string): string {
  const key = relativePath.replace(/\\/g, "/").replace(/^\//, "");
  if (cache.has(key)) return cache.get(key)!;

  const full = join(promptsRoot(), ...key.split("/"));
  if (!existsSync(full)) {
    cache.set(key, "");
    return "";
  }
  const text = readFileSync(full, "utf8").trim();
  cache.set(key, text);
  return text;
}

/** For tests / hot-reload in long-lived servers. */
export function clearPromptCache(): void {
  cache.clear();
}

export function getSystemPreamble(): string {
  return loadPrompt("system.txt");
}

export function getWritingRules(): string {
  return loadPrompt("writing_rules.txt");
}

export function getChapterRules(): string {
  return loadPrompt("chapter_generation_rules.txt");
}

export function getTitleRules(): string {
  return loadPrompt("title_generator.txt");
}

export function getDedicationRules(): string {
  return loadPrompt("dedication.txt");
}

export function getQualityCheckRules(): string {
  return loadPrompt("quality_check.txt");
}

export function getHumanizerRules(): string {
  return loadPrompt("humanizer.txt");
}

export function getBestPractices(): string {
  return loadPrompt("relationship/best_practices.txt");
}

/**
 * Dynamically load the relationship guide for the user's UI selection.
 * Falls back to best_practices + short in-code guide if the file is missing.
 */
export function getRelationshipPrompt(id: RelationshipId): string {
  const path = RELATIONSHIP_PROMPT_FILES[id];
  const fromFile = loadPrompt(path);
  if (fromFile) return fromFile;

  const best = getBestPractices();
  const fallback = relationshipStoryGuide(id);
  return [best, fallback].filter(Boolean).join("\n\n");
}

function joinBlocks(...parts: (string | undefined | null)[]): string {
  return parts
    .map((p) => (p || "").trim())
    .filter(Boolean)
    .join("\n\n---\n\n");
}

/** Keep system prompts small enough for free/fast models (avoids silent mock fallback). */
function clipForModel(text: string, maxChars: number): string {
  const t = text.trim();
  if (!t) return "";
  if (t.length <= maxChars) return t;
  return `${t.slice(0, maxChars).trim()}\n\n(…truncated)`;
}

/**
 * Mandatory stack for chapter work.
 * Optional mid-rules sit after writing_rules and before humanizer.txt.
 * Files are clipped so OpenRouter free models don't choke / return garbage.
 */
export function buildMandatoryChapterStack(opts: {
  relationship: RelationshipId;
  midRules?: (string | undefined | null)[];
  /** When true, keep more of the relationship guide (paid story models). */
  generous?: boolean;
}): string {
  const relMax = opts.generous ? 2800 : 1600;
  const humanMax = opts.generous ? 1600 : 1000;
  return joinBlocks(
    clipForModel(getSystemPreamble(), 500),
    clipForModel(getWritingRules(), 700),
    ...(opts.midRules || []),
    clipForModel(getHumanizerRules(), humanMax),
    clipForModel(getRelationshipPrompt(opts.relationship), relMax),
    clipForModel(getQualityCheckRules(), 500),
  );
}

/** Titles + dedication (free model). Still relationship-aware. */
export function buildTitleDedicationSystem(opts: {
  relationship: RelationshipId;
  languageBlock: string;
}): string {
  return joinBlocks(
    clipForModel(getSystemPreamble(), 400),
    clipForModel(getWritingRules(), 600),
    clipForModel(getTitleRules(), 500),
    clipForModel(getDedicationRules(), 300),
    clipForModel(getHumanizerRules(), 800),
    clipForModel(getRelationshipPrompt(opts.relationship), 1200),
    clipForModel(getQualityCheckRules(), 400),
    `Voice: ${relationshipVoice(opts.relationship)}`,
    opts.languageBlock,
    `Hard rules: no em dashes, no cringe, no invented facts, no exclamation marks.
Return JSON only:
{"titleOptions":["...","...","...","...","..."],"dedication":"..."}
Generate up to 5 title options. Dedication max 40 words.`,
  );
}

/**
 * Chapter narration (story model).
 * Flow: system → writing_rules → [chapter + best practices] → humanizer → relationship → quality_check
 */
export function buildChapterNarrationSystem(opts: {
  relationship: RelationshipId;
  languageBlock: string;
  writeIn: string;
}): string {
  const paidStory = Boolean(
    (process.env.OPENROUTER_STORY_MODEL || "").trim(),
  );
  return joinBlocks(
    buildMandatoryChapterStack({
      relationship: opts.relationship,
      generous: paidStory,
      midRules: [
        `You write intimate chapter openings for a printed keepsake made from a real WhatsApp chat.
This is not a summary. It is the soft voice between the quotes — grounded only in the sample lines.
Voice: ${relationshipVoice(opts.relationship)}`,
        clipForModel(getBestPractices(), 700),
        clipForModel(getChapterRules(), 400),
      ],
    }),
    opts.languageBlock,
    `Hard rules:
- This is NOT a chat summary. Do not recount messages one by one.
- Never paste sample lines or upcoming quotes into the narration (quotes appear separately)
- Never invent quotes, dates, events, or feelings the samples do not support
- Answer: why does this memory matter?
- Prefer texture and meaning over logistics (times, ETAs, "reached", pure emoji laughs)
- If the samples are mostly logistics or empty banter with no clear memory, write 2 short honest sentences and do not fake drama
- When samples are thin, write less
- Match the selected relationship type exactly
- No em dashes
- 3–5 short sentences per chapter unless samples are thin

Return JSON only: {"chapters":[{"title":"...","narration":"..."}]}
Use each chapter title EXACTLY as given. Return one object per chapter, in the same order.
Narration language: ${opts.writeIn}.`,
  );
}

/**
 * Second pass after chapter generation — same mandatory stack,
 * with rewrite-focused mid-rules before humanizer.txt.
 */
export function buildHumanizeSystem(opts: {
  relationship: RelationshipId;
  languageBlock: string;
}): string {
  return joinBlocks(
    buildMandatoryChapterStack({
      relationship: opts.relationship,
      midRules: [
        `You rewrite keepsake book narration so it sounds like a careful human wrote it — not an AI.
This is the humanizer pass: apply humanizer.txt strictly, then quality_check.txt.`,
      ],
    }),
    opts.languageBlock,
    `Rules:
- Keep the same meaning and any concrete details from the original
- Shorter sentences. Plain words. Warm, specific, a little imperfect
- No em dashes
- Do not invent new facts
- Do not add quotes
- If this is a group chat, keep it multi-person — never rewrite into a romance duo
- If quality_check would reject the text, rewrite until it would pass
- Output ONLY the rewritten narration, no labels`,
  );
}
