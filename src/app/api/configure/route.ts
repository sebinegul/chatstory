import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionOrThrow } from "@/lib/session";
import { isTemplateId } from "@/lib/templates/registry";
import { isRelationshipId } from "@/lib/relationships";

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
    if (!aiChooses && Array.isArray(chapters) && chapters.length > 15) {
      return NextResponse.json({ error: "Maximum 15 chapters." }, { status: 400 });
    }

    await getSessionOrThrow(sessionId);

    const chaptersToStore = aiChooses ? [] : chapters;

    await prisma.bookConfig.upsert({
      where: { sessionId },
      create: {
        sessionId,
        personA: String(personA),
        personB: String(personB),
        relationship: String(relationship),
        specialDatesJson: JSON.stringify(specialDates),
        chaptersJson: JSON.stringify(chaptersToStore),
        templateId,
        keyword: String(keyword || ""),
      },
      update: {
        personA: String(personA),
        personB: String(personB),
        relationship: String(relationship),
        specialDatesJson: JSON.stringify(specialDates),
        chaptersJson: JSON.stringify(chaptersToStore),
        templateId,
        keyword: String(keyword || ""),
      },
    });

    await prisma.session.update({
      where: { id: sessionId },
      data: { status: "configured" },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Configure failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
