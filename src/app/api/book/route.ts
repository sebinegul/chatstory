import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionOrThrow } from "@/lib/session";
import { normalizeTemplateId } from "@/lib/templates/registry";

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
