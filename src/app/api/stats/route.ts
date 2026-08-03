import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionOrThrow } from "@/lib/session";
import { deserializeChat } from "@/lib/parser/serialize";
import { computeStats } from "@/lib/scanner/stats";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    const keyword = req.nextUrl.searchParams.get("keyword") || "";
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    await getSessionOrThrow(sessionId);
    const upload = await prisma.chatUpload.findUnique({ where: { sessionId } });
    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    const chat = deserializeChat(upload.parsedJson);
    const stats = computeStats(chat, keyword || undefined);

    return NextResponse.json({
      ...stats,
      firstAt: stats.firstAt.toISOString(),
      lastAt: stats.lastAt.toISOString(),
      participants: chat.participants,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stats failed";
    const status = message.includes("not found") || message.includes("expired") || message.includes("deleted") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
