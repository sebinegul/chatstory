import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionOrThrow } from "@/lib/session";
import { normalizeTemplateId } from "@/lib/templates/registry";
import type { BookPageModel } from "@/lib/ai/types";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    await getSessionOrThrow(sessionId);
    const book = await prisma.book.findUnique({ where: { sessionId } });
    const config = await prisma.bookConfig.findUnique({ where: { sessionId } });
    if (!book || !config) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    return NextResponse.json({
      title: book.title,
      titleOptions: JSON.parse(book.titleOptionsJson),
      dedication: book.dedication,
      pages: JSON.parse(book.pagesJson),
      isWatermarked: book.isWatermarked,
      templateId: normalizeTemplateId(config.templateId) || "elegant-gold",
      personA: config.personA,
      personB: config.personB,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

/** Set the cover title from AI options (or a short custom string). */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionId = String(body.sessionId || "");
    const title = String(body.title || "").trim();
    if (!sessionId || !title) {
      return NextResponse.json(
        { error: "sessionId and title required" },
        { status: 400 },
      );
    }
    if (title.length > 80) {
      return NextResponse.json({ error: "Title is too long." }, { status: 400 });
    }

    await getSessionOrThrow(sessionId);
    const book = await prisma.book.findUnique({ where: { sessionId } });
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const options = JSON.parse(book.titleOptionsJson || "[]") as string[];
    const pages = JSON.parse(book.pagesJson) as BookPageModel[];
    const nextPages = pages.map((p) =>
      p.type === "cover" ? { ...p, title } : p,
    );
    const nextOptions = options.includes(title)
      ? [title, ...options.filter((o) => o !== title)]
      : [title, ...options].slice(0, 6);

    await prisma.book.update({
      where: { sessionId },
      data: {
        title,
        titleOptionsJson: JSON.stringify(nextOptions),
        pagesJson: JSON.stringify(nextPages),
      },
    });

    return NextResponse.json({
      ok: true,
      title,
      titleOptions: nextOptions,
      pages: nextPages,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
