import type { ParsedMessage } from "@/lib/parser/types";
import type { QuoteModel } from "./types";

/** Obvious noise — never surface as a keepsake quote. */
export function isBadQuote(body: string): boolean {
  const t = body.trim();
  if (t.length < 12) return true;
  if (t.length > 280) return true;
  if (/https?:\/\//i.test(t)) return true;
  if (/maps\.google|goo\.gl\/maps|maps\.app\.goo/i.test(t)) return true;
  if (/^location:\s*/i.test(t)) return true;
  if (
    /<media omitted>|image omitted|video omitted|audio omitted|sticker omitted|document omitted|gif omitted/i.test(
      t,
    )
  ) {
    return true;
  }
  if (/^[\d\s.,+\-°]+$/.test(t)) return true;

  const letters = (t.match(/\p{L}/gu) || []).length;
  if (letters < 8) return true;

  const emoji = (t.match(/\p{Extended_Pictographic}/gu) || []).length;
  // Pure / near-pure reaction spam
  if (emoji >= 2 && letters < 30) return true;
  if (emoji >= 3 && letters < 50) return true;
  if (/^(ha(ha)+|he(he)+|lol+|lmao+|rofl+|omg+)\s*$/i.test(t)) return true;

  // Empty acknowledgements (quote_selection.txt)
  if (
    /^(ok|okay|k|kk|hmm+|hmm+|yes|yup|ya+|nah|no|oh+|nice|cool|same|true|done|saku|aste)[\s.!?]*$/i.test(
      t,
    )
  ) {
    return true;
  }

  return false;
}

function hasEmotionalSignal(body: string): boolean {
  return /[❤️😍🥰😊😂😭🥺]|love|miss|sorry|thank|happy|proud|care|scared|worried|forgive|congrats|celebrate|miss you|take care|i'm here|im here|support|proud of|well done/i.test(
    body,
  );
}

function looksLikeLogistics(body: string): boolean {
  return /\b(one hour|1 hour|\d+\s*(min|mins|minutes|hr|hrs|km)|reached|reaching|coming|on the way|otp|location|call me|ping me|where are you|eta|leave now|start at|meet at)\b/i.test(
    body,
  );
}

/**
 * Higher = more worth printing.
 * Prefers personality, emotion, and conversation over logistics / emoji pile-ons.
 */
export function quoteScore(body: string): number {
  const t = body.trim();
  let score = Math.min(t.length, 160);

  if (hasEmotionalSignal(t)) score += 55;
  if (/\?$/.test(t)) score += 8;

  // Multi-speaker conversational texture
  if (t.length > 40 && (t.match(/[.!?]/g) || []).length >= 1) score += 12;

  // Penalize thin logistics unless they also carry care
  if (looksLikeLogistics(t) && !hasEmotionalSignal(t)) score -= 50;

  const emoji = (t.match(/\p{Extended_Pictographic}/gu) || []).length;
  const letters = (t.match(/\p{L}/gu) || []).length;
  if (emoji > letters / 3) score -= 25;

  // Inside-joke / teasing energy (group chats) — still need real words
  if (/\b(hange|troll|roast|meme|send|wait|bro|macha|dude)\b/i.test(t) && letters > 20) {
    score += 10;
  }

  return score;
}

/** Meaningful enough to anchor a chapter page. */
export function isMeaningfulQuote(body: string): boolean {
  if (isBadQuote(body)) return false;
  return quoteScore(body) >= 40;
}

export function pickQuotes(messages: ParsedMessage[], limit = 3): QuoteModel[] {
  const usable = messages
    .filter((m) => !m.deleted && isMeaningfulQuote(m.body))
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

/** How "story-worthy" a message window is (for chapter picking). */
export function windowStoryScore(messages: ParsedMessage[]): number {
  const usable = messages.filter((m) => !m.deleted && isMeaningfulQuote(m.body));
  if (usable.length === 0) return 0;
  const top = usable
    .map((m) => quoteScore(m.body))
    .sort((a, b) => b - a)
    .slice(0, 8);
  const sum = top.reduce((a, b) => a + b, 0);
  const authors = new Set(usable.map((m) => m.author)).size;
  return sum + authors * 15 + Math.min(usable.length, 20) * 3;
}
