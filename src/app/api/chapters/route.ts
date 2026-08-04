import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionOrThrow } from "@/lib/session";
import { deserializeChat } from "@/lib/parser/serialize";
import { regenerateChapterWithAI } from "@/lib/ai/hybrid-generator";
import type { BookPageModel } from "@/lib/ai/types";
import type { TemplateId } from "@/lib/templates/registry";
import type { ChapterIdea } from "@/lib/scanner/windows";
import type { RelationshipId } from "@/lib/relationships";

export const maxDuration = 60;

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, action } = body;
    if (!sessionId || !action) {
      return NextResponse.json(
        { error: "sessionId and action required" },
        { status: 400 },
      );
    }

    await getSessionOrThrow(sessionId);
    const book = await prisma.book.findUnique({ where: { sessionId } });
    const config = await prisma.bookConfig.findUnique({ where: { sessionId } });
    const upload = await prisma.chatUpload.findUnique({ where: { sessionId } });
    if (!book || !config || !upload) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    let pages = JSON.parse(book.pagesJson) as BookPageModel[];

    if (action === "rename") {
      const { fromTitle, toTitle } = body;
      pages = pages.map((p) =>
        p.type === "chapter" && p.title === fromTitle
          ? { ...p, title: String(toTitle) }
          : p,
      );
    } else if (action === "reorder") {
      const { order } = body as { order: string[] };
      const chapters = pages.filter((p) => p.type === "chapter");
      const rest = pages.filter((p) => p.type !== "chapter");
      const byTitle = new Map(
        chapters.map((c) => [c.type === "chapter" ? c.title : "", c]),
      );
      const reordered = order
        .map((t) => byTitle.get(t))
        .filter(Boolean) as BookPageModel[];
      const leftover = chapters.filter(
        (c) => c.type === "chapter" && !order.includes(c.title),
      );
      const cover = rest.filter(
        (p) => p.type === "cover" || p.type === "dedication",
      );
      const tail = rest.filter(
        (p) => p.type === "numbers" || p.type === "timeline",
      );
      pages = [...cover, ...reordered, ...leftover, ...tail];
    } else if (action === "regenerate") {
      const { title } = body;
      if (!title) {
        return NextResponse.json(
          { error: "Chapter title required" },
          { status: 400 },
        );
      }
      const chat = deserializeChat(upload.parsedJson);
      const specialDates = JSON.parse(config.specialDatesJson) as {
        label: string;
        date: string;
      }[];
      const chapters = JSON.parse(config.chaptersJson) as ChapterIdea[];
      const existing = pages.find(
        (p) => p.type === "chapter" && p.title === title,
      );
      const page = await regenerateChapterWithAI(
        {
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
          aiChooses: chapters.length === 0,
          templateId: config.templateId as TemplateId,
          keyword: config.keyword,
        },
        String(title),
      );
      if (page && page.type === "chapter") {
        // Keep any image already placed on this chapter
        if (
          existing &&
          existing.type === "chapter" &&
          existing.imageUrl
        ) {
          page.imageUrl = existing.imageUrl;
          page.imageCaption = existing.imageCaption;
        }
        pages = pages.map((p) =>
          p.type === "chapter" && p.title === title ? page : p,
        );
      } else {
        return NextResponse.json(
          { error: "Could not regenerate that chapter" },
          { status: 500 },
        );
      }
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    await prisma.book.update({
      where: { sessionId },
      data: { pagesJson: JSON.stringify(pages) },
    });

    return NextResponse.json({ ok: true, pages });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Chapter update failed" },
      { status: 500 },
    );
  }
}
