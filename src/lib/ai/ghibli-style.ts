/**
 * Restyle photos into a soft Studio Ghibli–inspired look via OpenRouter Images API.
 * Falls back to the original image if the key/model is unavailable.
 */

export const IMAGE_MODEL =
  process.env.OPENROUTER_IMAGE_MODEL || "google/gemini-2.5-flash-image";

const GHIBLI_PROMPT = `Restyle this exact photo as a hand-painted Studio Ghibli anime frame.
Keep the same people, poses, composition, and recognizable faces.
Soft watercolor skies, gentle cel shading, warm ambient light, lush greens and soft blues,
painterly backgrounds, whimsical and tender mood. No text, no logos, no watermark.`;

function hasKey() {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

function toDataUrl(b64: string, mime = "image/jpeg"): string {
  if (b64.startsWith("data:")) return b64;
  return `data:${mime};base64,${b64}`;
}

export async function stylizeImageGhibli(dataUrl: string): Promise<string> {
  if (!dataUrl?.startsWith("data:image/")) return dataUrl;
  if (!hasKey()) return dataUrl;

  const key = process.env.OPENROUTER_API_KEY!.trim();

  try {
    const res = await fetch("https://openrouter.ai/api/v1/images", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
        "X-Title": "ChatStory",
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
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
      console.warn("Ghibli stylize failed", res.status, text.slice(0, 300));
      return dataUrl;
    }

    const json = (await res.json()) as {
      data?: { b64_json?: string; url?: string }[];
    };
    const first = json.data?.[0];
    if (first?.b64_json) {
      return toDataUrl(first.b64_json, "image/jpeg");
    }
    if (first?.url?.startsWith("data:")) return first.url;
    if (first?.url) {
      // Prefer keeping a fetchable URL only if we can embed as data URL for PDF
      try {
        const imgRes = await fetch(first.url);
        if (imgRes.ok) {
          const buf = Buffer.from(await imgRes.arrayBuffer());
          const mime = imgRes.headers.get("content-type") || "image/jpeg";
          return `data:${mime};base64,${buf.toString("base64")}`;
        }
      } catch {
        /* fall through */
      }
    }
  } catch (err) {
    console.warn("Ghibli stylize error", err);
  }

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
