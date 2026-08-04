import type { DetectedLanguage } from "./detect-language";
import { languagePromptBlock } from "./detect-language";
import {
  FREE_MODEL,
  FREE_MODEL_CANDIDATES,
  openRouterChat,
} from "./openrouter";
import {
  peopleLabelForBook,
  type RelationshipId,
} from "@/lib/relationships";
import { buildHumanizeSystem } from "./prompts";

/** Soften AI sludge into short, human-sounding prose. */
export async function humanizeNarration(
  text: string,
  opts: {
    relationship: RelationshipId;
    lang: DetectedLanguage;
    personA: string;
    personB: string;
  },
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  const people = peopleLabelForBook(
    opts.relationship,
    opts.personA,
    opts.personB,
  );

  try {
    const raw = await openRouterChat({
      model: FREE_MODEL,
      fallbacks: FREE_MODEL_CANDIDATES,
      temperature: 0.55,
      system: buildHumanizeSystem({
        relationship: opts.relationship,
        languageBlock: languagePromptBlock(opts.lang),
      }),
      user: `People: ${people}
Relationship selected in UI: ${opts.relationship}
Language: ${opts.lang.writeIn}

Rewrite this narration:
${trimmed}`,
    });
    return raw.replace(/\u2014/g, ",").replace(/^["']|["']$/g, "").trim() || trimmed;
  } catch (err) {
    console.warn("humanize failed", err);
    return trimmed;
  }
}
