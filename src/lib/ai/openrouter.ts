/**
 * Model routing:
 * - FREE_MODEL: titles, dedication, light helpers (OpenRouter free tier)
 * - STORY_MODEL: chapter narration / main story extraction (better model)
 *
 * Without OPENROUTER_API_KEY the app falls back to the local mock generator.
 */

export const FREE_MODEL =
  process.env.OPENROUTER_FREE_MODEL ||
  "google/gemini-2.0-flash-exp:free";

export const STORY_MODEL =
  process.env.OPENROUTER_STORY_MODEL || "google/gemini-2.5-flash";

export function hasOpenRouterKey(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

export async function openRouterChat({
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
  const key = process.env.OPENROUTER_API_KEY?.trim();
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
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty OpenRouter response");
  return content;
}

export function parseJsonFromModel<T>(raw: string): T {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = fenced ? fenced[1] : raw;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model output");
  return JSON.parse(text.slice(start, end + 1)) as T;
}
