import type { DetectedLanguage } from "./detect-language";
import { languagePromptBlock } from "./detect-language";
import {
  FREE_MODEL,
  FREE_MODEL_CANDIDATES,
  openRouterChat,
} from "./openrouter";
import { relationshipStoryGuide, type RelationshipId } from "@/lib/relationships";

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

  try {
    const raw = await openRouterChat({
      model: FREE_MODEL,
      fallbacks: FREE_MODEL_CANDIDATES,
      temperature: 0.55,
      system: `You rewrite keepsake book narration so it sounds like a careful human wrote it — not an AI.

Relationship guide: ${relationshipStoryGuide(opts.relationship)}
${languagePromptBlock(opts.lang)}

Rules:
- Keep the same meaning and any concrete details from the original
- Shorter sentences. Plain words. Warm, specific, a little imperfect
- No em dashes
- Ban: journey, tapestry, delve, testament, cherished, whirlwind, soulmate, ordinary care, "the soft voice", "something settles", forever, etched
- Do not invent new facts
- Do not add quotes
- Output ONLY the rewritten narration, no labels`,
      user: `People: ${opts.personA} and ${opts.personB}
Relationship: ${opts.relationship}
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
