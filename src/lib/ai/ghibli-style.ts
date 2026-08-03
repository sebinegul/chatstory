/**
 * Restyle photos into a Studio Ghibli–inspired look.
 * Tries dedicated Images API, then chat-completions image edit (Gemini).
 */

export const IMAGE_MODEL =
  process.env.OPENROUTER_IMAGE_MODEL || "google/gemini-2.5-flash-image";

const IMAGE_MODEL_FALLBACKS = [
  IMAGE_MODEL,
  "google/gemini-2.5-flash-image",
  "google/gemini-3.1-flash-image-preview",
];

const GHIBLI_PROMPT = `Edit this photo into a hand-painted Studio Ghibli anime still.
Keep the same people, faces, pose, and composition.
Soft watercolor sky, gentle cel shading, warm light, lush greens and soft blues,
painterly background, whimsical tender mood.
Output only the restyled image. No text, logos, or watermark.`;

function hasKey() {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

function toDataUrl(b64: string, mime = "image/jpeg"): string {
  if (b64.startsWith("data:")) return b64;
  return `data:${mime};base64,${b64}`;
}

function extractImageFromChat(json: unknown): string | null {
  const data = json as {
    choices?: {
      message?: {
        images?: { image_url?: { url?: string } | string; url?: string }[];
        content?: unknown;
      };
    }[];
  };
  const message = data.choices?.[0]?.message;
  const images = message?.images;
  if (Array.isArray(images) && images[0]) {
    const first = images[0];
    const url =
      typeof first.image_url === "string"
        ? first.image_url
        : first.image_url?.url || first.url;
    if (url?.startsWith("data:image/")) return url;
    if (url) return url;
  }
  const content = message?.content;
  if (typeof content === "string") {
    const match = content.match(/data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]+/);
    if (match) return match[0];
  }
  return null;
}

async function stylizeViaImagesApi(
  key: string,
  dataUrl: string,
  model: string,
): Promise<string | null> {
  const res = await fetch("https://openrouter.ai/api/v1/images", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
      "X-Title": "ChatStory",
    },
    body: JSON.stringify({
      model,
      prompt: GHIBLI_PROMPT,
      input_references: [dataUrl],
      aspect_ratio: "3:4",
      resolution: "1K",
      output_format: "jpeg",
      n: 1,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.warn("Ghibli Images API failed", model, res.status, text.slice(0, 200));
    return null;
  }
  const json = (await res.json()) as {
    data?: { b64_json?: string; url?: string }[];
  };
  const first = json.data?.[0];
  if (first?.b64_json) return toDataUrl(first.b64_json, "image/jpeg");
  if (first?.url?.startsWith("data:")) return first.url;
  if (first?.url) {
    try {
      const imgRes = await fetch(first.url);
      if (imgRes.ok) {
        const buf = Buffer.from(await imgRes.arrayBuffer());
        const mime = imgRes.headers.get("content-type") || "image/jpeg";
        return `data:${mime};base64,${buf.toString("base64")}`;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

async function stylizeViaChat(
  key: string,
  dataUrl: string,
  model: string,
): Promise<string | null> {
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
      modalities: ["image", "text"],
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: GHIBLI_PROMPT },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.warn("Ghibli chat image failed", model, res.status, text.slice(0, 200));
    return null;
  }
  const json = await res.json();
  const extracted = extractImageFromChat(json);
  if (!extracted) return null;
  if (extracted.startsWith("data:")) return extracted;
  try {
    const imgRes = await fetch(extracted);
    if (imgRes.ok) {
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const mime = imgRes.headers.get("content-type") || "image/jpeg";
      return `data:${mime};base64,${buf.toString("base64")}`;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function stylizeImageGhibli(dataUrl: string): Promise<string> {
  if (!dataUrl?.startsWith("data:image/")) return dataUrl;
  if (!hasKey()) {
    console.warn("Ghibli stylize skipped: no OPENROUTER_API_KEY");
    return dataUrl;
  }

  const key = process.env.OPENROUTER_API_KEY!.trim();
  const models = Array.from(new Set(IMAGE_MODEL_FALLBACKS.filter(Boolean)));

  for (const model of models) {
    try {
      const viaImages = await stylizeViaImagesApi(key, dataUrl, model);
      if (viaImages && viaImages !== dataUrl) {
        console.info(`[ghibli] stylized via Images API (${model})`);
        return viaImages;
      }
    } catch (err) {
      console.warn("Ghibli Images API error", model, err);
    }
    try {
      const viaChat = await stylizeViaChat(key, dataUrl, model);
      if (viaChat && viaChat !== dataUrl) {
        console.info(`[ghibli] stylized via chat (${model})`);
        return viaChat;
      }
    } catch (err) {
      console.warn("Ghibli chat error", model, err);
    }
  }

  console.warn("Ghibli stylize: all models failed, keeping original");
  return dataUrl;
}

export async function stylizeBookImagesGhibli(input: {
  coverImage?: string;
  extraImages?: { dataUrl: string; placement: string; caption?: string }[];
}): Promise<{
  coverImage?: string;
  extraImages?: { dataUrl: string; placement: string; caption?: string }[];
}> {
  const coverImage = input.coverImage
    ? await stylizeImageGhibli(input.coverImage)
    : undefined;

  const extras = input.extraImages || [];
  const extraImages = [];
  for (const img of extras) {
    extraImages.push({
      ...img,
      dataUrl: await stylizeImageGhibli(img.dataUrl),
    });
  }

  return { coverImage, extraImages };
}
