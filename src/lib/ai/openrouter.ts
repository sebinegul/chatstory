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

/** Per-attempt OpenRouter timeout — prevents one hung free model from burning the whole Vercel window. */
const DEFAULT_ATTEMPT_TIMEOUT_MS = 40_000;
/** Don't walk the entire free-model list on every call (that alone can cause 504s). */
const DEFAULT_MAX_ATTEMPTS = 3;

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
  timeoutMs = DEFAULT_ATTEMPT_TIMEOUT_MS,
  json = false,
}: {
  model: string;
  system: string;
  user: string;
  temperature?: number;
  timeoutMs?: number;
  json?: boolean;
}): Promise<string> {
  const key = cleanEnv(process.env.OPENROUTER_API_KEY);
  if (!key) {
    throw new Error("OPENROUTER_API_KEY missing");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const body: Record<string, unknown> = {
      model,
      temperature,
      max_tokens: 2500,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    };
    if (json) {
      body.response_format = { type: "json_object" };
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.OPENROUTER_SITE_URL || "https://chatstory-psi.vercel.app",
        "X-Title": "ChatStory",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      // Some free models reject response_format — caller can retry without json
      throw new Error(`OpenRouter ${res.status} (${model}): ${text.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: unknown }[];
    };
    const content = extractContent(data.choices?.[0]?.message);
    if (!content) throw new Error(`Empty OpenRouter response (${model})`);
    return content;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`OpenRouter timeout after ${timeoutMs}ms (${model})`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Try models in order until one returns usable text. */
export async function openRouterChat({
  model,
  system,
  user,
  temperature = 0.6,
  fallbacks,
  timeoutMs = DEFAULT_ATTEMPT_TIMEOUT_MS,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  json = false,
}: {
  model: string;
  system: string;
  user: string;
  temperature?: number;
  fallbacks?: string[];
  timeoutMs?: number;
  maxAttempts?: number;
  json?: boolean;
}): Promise<string> {
  const chain = Array.from(
    new Set([cleanEnv(model) || model, ...(fallbacks || [])].filter(Boolean)),
  ).slice(0, Math.max(1, maxAttempts));
  const errors: string[] = [];

  for (const candidate of chain) {
    for (const useJson of json ? [true, false] : [false]) {
      try {
        return await openRouterChatOnce({
          model: candidate,
          system,
          user,
          temperature,
          timeoutMs,
          json: useJson,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(
          `[openrouter] ${candidate}${useJson ? " json" : ""} failed:`,
          msg.slice(0, 200),
        );
        errors.push(msg.slice(0, 120));
        // Only retry without json when the error looks like format rejection
        if (useJson && !/400|response_format|json_object/i.test(msg)) {
          break;
        }
      }
    }
  }

  throw new Error(
    `All OpenRouter models failed (${chain.join(" → ")}): ${errors.join(" | ")}`,
  );
}

export function parseJsonFromModel<T>(raw: string): T {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = (fenced ? fenced[1] : raw).trim();

  const objStart = text.indexOf("{");
  const objEnd = text.lastIndexOf("}");
  const arrStart = text.indexOf("[");
  const arrEnd = text.lastIndexOf("]");

  let candidate = "";
  // If a JSON array appears before any object, treat it as chapters[]
  if (
    arrStart !== -1 &&
    arrEnd > arrStart &&
    (objStart === -1 || arrStart < objStart)
  ) {
    candidate = `{"chapters":${text.slice(arrStart, arrEnd + 1)}}`;
  } else if (objStart !== -1 && objEnd > objStart) {
    candidate = text.slice(objStart, objEnd + 1);
  } else {
    throw new Error("No JSON object in model output");
  }

  try {
    return JSON.parse(candidate) as T;
  } catch {
    const fixed = candidate
      .replace(/,\s*([\]}])/g, "$1")
      .replace(/\n/g, " ")
      .replace(/\t/g, " ");
    return JSON.parse(fixed) as T;
  }
}
