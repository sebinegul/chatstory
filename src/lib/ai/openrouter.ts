/**
 * Model routing with free-model failover.
 * Paid story model first (if set), then free candidates. Never throw away the book —
 * callers should still catch and use the local mock generator.
 */

function cleanEnv(value: string | undefined): string {
  return (value || "").trim().replace(/^["']|["']$/g, "");
}

/** Prefer env, then currently-working free models (DeepSeek :free is gone as of mid-2026). */
export const FREE_MODEL_CANDIDATES: string[] = Array.from(
  new Set(
    [
      cleanEnv(process.env.OPENROUTER_FREE_MODEL),
      "google/gemma-4-31b-it:free",
      "google/gemma-4-26b-a4b-it:free",
      "nvidia/nemotron-3-nano-30b-a3b:free",
      "nvidia/nemotron-nano-9b-v2:free",
      "openrouter/free",
    ].filter(Boolean),
  ),
);

export const FREE_MODEL = FREE_MODEL_CANDIDATES[0] || "google/gemma-4-31b-it:free";

export const STORY_MODEL =
  cleanEnv(process.env.OPENROUTER_STORY_MODEL) || FREE_MODEL;

export const STORY_MODEL_CANDIDATES: string[] = Array.from(
  new Set([STORY_MODEL, ...FREE_MODEL_CANDIDATES].filter(Boolean)),
);

export function hasOpenRouterKey(): boolean {
  return Boolean(cleanEnv(process.env.OPENROUTER_API_KEY));
}

function extractContent(message: unknown): string {
  if (!message || typeof message !== "object") return "";
  const m = message as {
    content?: unknown;
    reasoning?: unknown;
  };
  const c = m.content;
  if (typeof c === "string") return c.trim();
  if (Array.isArray(c)) {
    return c
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: string }).text || "");
        }
        return "";
      })
      .join("")
      .trim();
  }
  if (typeof m.reasoning === "string" && m.reasoning.trim()) {
    return m.reasoning.trim();
  }
  return "";
}

async function openRouterChatOnce({
  model,
  system,
  user,
  temperature = 0.6,
}: {
  model: string;
  system: string;
  user: string;
  temperature?: number;
}): Promise<string> {
  const key = cleanEnv(process.env.OPENROUTER_API_KEY);
  if (!key) {
    throw new Error("OPENROUTER_API_KEY missing");
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
      "X-Title": "ChatStory",
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: 8000,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter ${res.status} (${model}): ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: unknown }[];
  };
  const content = extractContent(data.choices?.[0]?.message);
  if (!content) throw new Error(`Empty OpenRouter response (${model})`);
  return content;
}

/** Try models in order until one returns usable text. */
export async function openRouterChat({
  model,
  system,
  user,
  temperature = 0.6,
  fallbacks,
}: {
  model: string;
  system: string;
  user: string;
  temperature?: number;
  fallbacks?: string[];
}): Promise<string> {
  const chain = Array.from(
    new Set([cleanEnv(model) || model, ...(fallbacks || [])].filter(Boolean)),
  );
  const errors: string[] = [];

  for (const candidate of chain) {
    try {
      return await openRouterChatOnce({
        model: candidate,
        system,
        user,
        temperature,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[openrouter] ${candidate} failed:`, msg.slice(0, 200));
      errors.push(msg.slice(0, 120));
    }
  }

  throw new Error(
    `All OpenRouter models failed (${chain.join(" → ")}): ${errors.join(" | ")}`,
  );
}

export function parseJsonFromModel<T>(raw: string): T {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = fenced ? fenced[1] : raw;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model output");
  return JSON.parse(text.slice(start, end + 1)) as T;
}
