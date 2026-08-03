import type { ParsedChat } from "@/lib/parser/types";

export interface DetectedLanguage {
  /** BCP-ish code for prompts */
  code: string;
  /** Human label for prompts */
  label: string;
  /** How to write: "English" | "Hindi (Devanagari)" | "Hinglish" etc. */
  writeIn: string;
}

type ScriptHit = {
  code: string;
  label: string;
  writeIn: string;
  count: number;
};

const HINGLISH_HINTS = [
  "hai",
  "haan",
  "nahi",
  "kya",
  "kyun",
  "kyu",
  "acha",
  "accha",
  "theek",
  "thik",
  "bhai",
  "yaar",
  "matlab",
  "bahut",
  "kitna",
  "kaisa",
  "kaise",
  "kab",
  "abhi",
  "kal",
  "aaj",
  "jaldi",
  "bas",
  "sahi",
  "please",
  "bro",
  "dear",
  "ji",
  "na",
  "toh",
  "aur",
  "par",
  "lekin",
  "kyunki",
];

function scriptBucket(ch: string): string | null {
  const code = ch.codePointAt(0) ?? 0;
  if (code >= 0x0900 && code <= 0x097f) return "hi"; // Devanagari
  if (code >= 0x0d00 && code <= 0x0d7f) return "ml"; // Malayalam
  if (code >= 0x0b80 && code <= 0x0bff) return "ta"; // Tamil
  if (code >= 0x0c00 && code <= 0x0c7f) return "te"; // Telugu
  if (code >= 0x0c80 && code <= 0x0cff) return "kn"; // Kannada
  if (code >= 0x0a80 && code <= 0x0aff) return "gu"; // Gujarati
  if (code >= 0x0a00 && code <= 0x0a7f) return "pa"; // Gurmukhi
  if (code >= 0x0980 && code <= 0x09ff) return "bn"; // Bengali
  if (code >= 0x0600 && code <= 0x06ff) return "ar"; // Arabic
  if (
    (code >= 0x0041 && code <= 0x007a) ||
    (code >= 0x00c0 && code <= 0x024f)
  ) {
    return "latin";
  }
  return null;
}

const SCRIPT_META: Record<string, { label: string; writeIn: string }> = {
  hi: { label: "Hindi", writeIn: "Hindi in Devanagari script" },
  ml: { label: "Malayalam", writeIn: "Malayalam" },
  ta: { label: "Tamil", writeIn: "Tamil" },
  te: { label: "Telugu", writeIn: "Telugu" },
  kn: { label: "Kannada", writeIn: "Kannada" },
  gu: { label: "Gujarati", writeIn: "Gujarati" },
  pa: { label: "Punjabi", writeIn: "Punjabi (Gurmukhi)" },
  bn: { label: "Bengali", writeIn: "Bengali" },
  ar: { label: "Arabic", writeIn: "Arabic" },
  latin: { label: "English", writeIn: "English" },
};

/**
 * Detect the dominant language of a WhatsApp chat from message bodies.
 * Handles Indic scripts and common Hinglish (Latin + Hindi words).
 */
export function detectChatLanguage(chat: ParsedChat): DetectedLanguage {
  const sample = chat.messages
    .filter((m) => !m.deleted && m.body.trim().length > 2)
    .slice(-400);

  const counts = new Map<string, number>();
  let latinWords = 0;
  let hinglishHits = 0;

  for (const m of sample) {
    for (const ch of m.body) {
      const bucket = scriptBucket(ch);
      if (!bucket) continue;
      counts.set(bucket, (counts.get(bucket) || 0) + 1);
    }
    const words = m.body.toLowerCase().match(/[a-z']+/g) || [];
    latinWords += words.length;
    for (const w of words) {
      if (HINGLISH_HINTS.includes(w)) hinglishHits += 1;
    }
  }

  const ranked: ScriptHit[] = [...counts.entries()]
    .map(([code, count]) => ({
      code,
      count,
      label: SCRIPT_META[code]?.label || code,
      writeIn: SCRIPT_META[code]?.writeIn || code,
    }))
    .sort((a, b) => b.count - a.count);

  const top = ranked[0];
  const nonLatin = ranked.find((r) => r.code !== "latin");

  // Strong non-Latin script wins
  if (nonLatin && nonLatin.count > (top?.count || 0) * 0.35) {
    // If Latin is also large, mixed
    const latin = ranked.find((r) => r.code === "latin");
    if (latin && latin.count > nonLatin.count * 0.5) {
      return {
        code: `${nonLatin.code}-mix`,
        label: `${nonLatin.label} + English mix`,
        writeIn: `the same mix of ${nonLatin.writeIn} and English that appears in the chat samples`,
      };
    }
    return {
      code: nonLatin.code,
      label: nonLatin.label,
      writeIn: nonLatin.writeIn,
    };
  }

  // Latin-dominant: English vs Hinglish
  if (latinWords > 20 && hinglishHits / Math.max(latinWords, 1) > 0.04) {
    return {
      code: "hi-Latn",
      label: "Hinglish",
      writeIn:
        "Hinglish — the natural mix of Hindi and English as typed in the chat (Latin script, not Devanagari unless samples use it)",
    };
  }

  return {
    code: "en",
    label: "English",
    writeIn: "English",
  };
}

export function languagePromptBlock(lang: DetectedLanguage): string {
  return `LANGUAGE (critical):
Write titles, dedication, and every chapter narration in ${lang.writeIn}.
Match the chat's tone and vocabulary. Do not translate quotes — quotes stay exactly as typed.
If samples mix languages, mix the same way. Never force English if the chat is not English.`;
}
