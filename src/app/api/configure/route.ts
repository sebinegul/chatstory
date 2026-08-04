import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionOrThrow } from "@/lib/session";
import { isTemplateId, normalizeTemplateId } from "@/lib/templates/registry";
import {
  GROUP_PARTICIPANT_CAP,
  isRelationshipId,
  parseGroupCast,
} from "@/lib/relationships";
import type { ExtraBookImage, ImagePlacement } from "@/lib/media";

const PLACEMENTS = new Set<ImagePlacement>([
  "dedication",
  "first-chapter",
  "middle-chapter",
  "last-chapter",
  "numbers",
  "timeline",
]);

function isDataUrlImage(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("data:image/") &&
    value.length < 2_500_000
  );
}

function normalizeExtraImages(raw: unknown): ExtraBookImage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 2)
    .filter(
      (item): item is ExtraBookImage =>
        !!item &&
        typeof item === "object" &&
        isDataUrlImage((item as ExtraBookImage).dataUrl) &&
        PLACEMENTS.has((item as ExtraBookImage).placement),
    )
    .map((item) => ({
      dataUrl: item.dataUrl,
      placement: item.placement,
      caption:
        typeof item.caption === "string" ? item.caption.slice(0, 80) : undefined,
    }));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId,
      personA,
      personB,
      relationship = "couple",
      specialDates = [],
      chapters = [],
      aiChooses = false,
      templateId,
      keyword = "",
      coverImage = "",
      extraImages = [],
    } = body;

    if (!sessionId || !personA || !personB || !templateId) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (!isTemplateId(templateId)) {
      return NextResponse.json({ error: "Unknown template." }, { status: 400 });
    }
    if (!isRelationshipId(String(relationship))) {
      return NextResponse.json({ error: "Choose a relationship type." }, { status: 400 });
    }
    if (relationship === "group") {
      const cast = parseGroupCast(String(personA), String(personB));
      if (cast.length < 3) {
        return NextResponse.json(
          { error: "Group chat needs at least 3 names." },
          { status: 400 },
        );
      }
      if (cast.length > GROUP_PARTICIPANT_CAP) {
        return NextResponse.json(
          { error: `Group chat supports up to ${GROUP_PARTICIPANT_CAP} names.` },
          { status: 400 },
        );
      }
    }
    if (!aiChooses && Array.isArray(chapters) && chapters.length > 15) {
      return NextResponse.json({ error: "Maximum 15 chapters." }, { status: 400 });
    }

    const cover =
      coverImage && isDataUrlImage(coverImage) ? String(coverImage) : "";
    if (coverImage && !cover) {
      return NextResponse.json(
        { error: "Cover image is too large or invalid. Try a smaller photo." },
        { status: 400 },
      );
    }
    const media = normalizeExtraImages(extraImages);

    await getSessionOrThrow(sessionId);

    const chaptersToStore = aiChooses ? [] : chapters;
    const normalizedTemplate = normalizeTemplateId(String(templateId))!;

    await prisma.bookConfig.upsert({
      where: { sessionId },
      create: {
        sessionId,
        personA: String(personA),
        personB: String(personB),
        relationship: String(relationship),
        specialDatesJson: JSON.stringify(specialDates),
        chaptersJson: JSON.stringify(chaptersToStore),
        templateId: normalizedTemplate,
        keyword: String(keyword || ""),
        coverImage: cover,
        mediaJson: JSON.stringify(media),
      },
      update: {
        personA: String(personA),
        personB: String(personB),
        relationship: String(relationship),
        specialDatesJson: JSON.stringify(specialDates),
        chaptersJson: JSON.stringify(chaptersToStore),
        templateId: normalizedTemplate,
        keyword: String(keyword || ""),
        coverImage: cover,
        mediaJson: JSON.stringify(media),
      },
    });

    await prisma.session.update({
      where: { id: sessionId },
      data: { status: "configured" },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("configure failed", err);
    const message = err instanceof Error ? err.message : "Configure failed";
    // Surface Prisma/schema issues clearly in dev
    return NextResponse.json(
      {
        error: message.includes("Unknown arg") || message.includes("column")
          ? "Database is out of date. Restart the server after migrations."
          : message,
      },
      { status: 500 },
    );
  }
}
