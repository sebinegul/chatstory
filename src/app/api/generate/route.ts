import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionOrThrow } from "@/lib/session";
import { deserializeChat } from "@/lib/parser/serialize";
import { bookGenerator } from "@/lib/ai/provider";
import { assertPreviewAllowed, recordPreview } from "@/lib/rate-limit";
import { hashIp } from "@/lib/ip";
import type { TemplateId } from "@/lib/templates/registry";
import type { ChapterIdea } from "@/lib/scanner/windows";
import type { RelationshipId } from "@/lib/relationships";
import type { ExtraBookImage } from "@/lib/media";
import { applyBookMedia } from "@/lib/ai/apply-media";
import { isGhibliTemplate } from "@/lib/templates/registry";
import { stylizeBookImagesGhibli } from "@/lib/ai/ghibli-style";

export const maxDuration = 120;

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const session = await getSessionOrThrow(sessionId);
    const rawIp = clientIp(req);
    const ipHash = session.clientIpHash || hashIp(rawIp);

    try {
      await assertPreviewAllowed(ipHash, rawIp);
    } catch {
      return NextResponse.json(
        { error: "You have reached today's free preview limit (2 per day)." },
        { status: 429 },
      );
    }

    const upload = await prisma.chatUpload.findUnique({ where: { sessionId } });
    const config = await prisma.bookConfig.findUnique({ where: { sessionId } });
    if (!upload || !config) {
      return NextResponse.json(
        { error: "Configure your book before generating." },
        { status: 400 },
      );
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { status: "generating" },
    });

    const chat = deserializeChat(upload.parsedJson);
    const specialDates = JSON.parse(config.specialDatesJson) as {
      label: string;
      date: string;
    }[];
    const chapters = JSON.parse(config.chaptersJson) as ChapterIdea[];
    const aiChooses = chapters.length === 0;

    let media: ExtraBookImage[] = [];
    try {
      media = JSON.parse(config.mediaJson || "[]") as ExtraBookImage[];
    } catch {
      media = [];
    }

    let coverImage = config.coverImage || undefined;
    if (isGhibliTemplate(config.templateId)) {
      try {
        const styled = await stylizeBookImagesGhibli({
          coverImage,
          extraImages: media,
        });
        coverImage = styled.coverImage;
        media = (styled.extraImages || []) as ExtraBookImage[];
      } catch (err) {
        console.warn("Ghibli stylize skipped", err);
      }
    }

    const rawBook = await bookGenerator.generateBook({
      chat,
      personA: config.personA,
      personB: config.personB,
      relationship: (config.relationship as RelationshipId) || "couple",
      specialDates,
      chapters: chapters.map((c) => ({
        ...c,
        startAt: new Date(c.startAt),
        endAt: new Date(c.endAt),
      })),
      aiChooses,
      templateId: config.templateId as TemplateId,
      keyword: config.keyword || "",
      coverImage,
      extraImages: media,
    });

    const book = applyBookMedia(rawBook, coverImage, media);

    await prisma.book.upsert({
      where: { sessionId },
      create: {
        sessionId,
        title: book.title,
        titleOptionsJson: JSON.stringify(book.titleOptions),
        dedication: book.dedication,
        pagesJson: JSON.stringify(book.pages),
        isWatermarked: true,
      },
      update: {
        title: book.title,
        titleOptionsJson: JSON.stringify(book.titleOptions),
        dedication: book.dedication,
        pagesJson: JSON.stringify(book.pages),
        isWatermarked: true,
      },
    });

    await recordPreview(ipHash, rawIp);
    await prisma.session.update({
      where: { id: sessionId },
      data: { status: "preview", previewCount: { increment: 1 } },
    });

    return NextResponse.json({ ok: true, title: book.title });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Generation failed." }, { status: 500 });
  }
}
