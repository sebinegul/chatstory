import { NextRequest, NextResponse } from "next/server";
import {
  looksLikeWhatsAppExport,
  parseWhatsAppExport,
} from "@/lib/parser/whatsapp";
import { serializeChat } from "@/lib/parser/serialize";
import { createSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { hashIp } from "@/lib/ip";

const MAX_BYTES = 10 * 1024 * 1024;

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const privacyAccepted = String(form.get("privacyAccepted") || "") === "true";

    if (!privacyAccepted) {
      return NextResponse.json(
        {
          error: "Please accept the privacy notice to continue.",
          code: "PRIVACY_REQUIRED",
        },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Upload a WhatsApp .txt file.", code: "NO_FILE" },
        { status: 400 },
      );
    }

    const name = (file.name || "").toLowerCase();
    if (name && !name.endsWith(".txt") && file.type && !file.type.includes("text")) {
      return NextResponse.json(
        {
          error: "Please upload the .txt chat export (not a zip or PDF).",
          code: "BAD_TYPE",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File is too large. Max size is 10 MB.", code: "TOO_LARGE" },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "That file is empty.", code: "EMPTY_FILE" },
        { status: 400 },
      );
    }

    const text = await file.text();
    if (!text.trim()) {
      return NextResponse.json(
        { error: "That file has no text content.", code: "EMPTY_TEXT" },
        { status: 400 },
      );
    }

    if (!looksLikeWhatsAppExport(text)) {
      return NextResponse.json(
        {
          error:
            "This does not look like a WhatsApp chat export. In WhatsApp: Chat info → Export chat → Without media → save the .txt file.",
          code: "NOT_WHATSAPP",
        },
        { status: 400 },
      );
    }

    let chat;
    try {
      chat = parseWhatsAppExport(text);
    } catch (err) {
      console.error("parse error", err);
      return NextResponse.json(
        {
          error:
            "Could not parse that WhatsApp export. Try exporting again without media.",
          code: "PARSE_ERROR",
        },
        { status: 400 },
      );
    }

    if (chat.messages.length === 0) {
      return NextResponse.json(
        {
          error:
            "No messages found. Android exports look like: 3/2/26, 9:49 pm - Name: hi. iPhone exports use [brackets]. Export Without media as .txt.",
          code: "NO_MESSAGES",
        },
        { status: 400 },
      );
    }

    const ipHash = hashIp(clientIp(req));
    const session = await createSession({ ipHash, privacyAccepted: true });

    await prisma.chatUpload.create({
      data: {
        sessionId: session.id,
        filename: file.name || "chat.txt",
        byteSize: file.size,
        parsedJson: serializeChat(chat),
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      messageCount: chat.messages.length,
      participants: chat.participants,
    });
  } catch (err) {
    console.error("upload failed", err);
    const prismaCode =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: unknown }).code)
        : "";
    if (
      prismaCode === "P1001" ||
      prismaCode === "P1000" ||
      prismaCode === "P1010" ||
      /DATABASE_URL|Environment variable not found/i.test(
        err instanceof Error ? err.message : String(err),
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Database is not configured on the server. Set DATABASE_URL and DIRECT_URL in Vercel env, then redeploy.",
          code: "DB_CONFIG",
        },
        { status: 500 },
      );
    }
    if (prismaCode.startsWith("P")) {
      return NextResponse.json(
        {
          error:
            "Database error while saving your upload. Check that the chatstory schema exists on Neon.",
          code: "DB_ERROR",
          prismaCode,
        },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Upload failed on the server. Try again in a moment.", code: "SERVER" },
      { status: 500 },
    );
  }
}
