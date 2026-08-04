import { NextRequest, NextResponse } from "next/server";
import {
  looksLikeWhatsAppExport,
  parseWhatsAppExport,
} from "@/lib/parser/whatsapp";
import { serializeChat } from "@/lib/parser/serialize";
import { createSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { hashIp } from "@/lib/ip";
import {
  extractChatTxtFromZip,
  MAX_UPLOAD_BYTES,
  SafeZipError,
} from "@/lib/upload/safe-zip-txt";

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

function isZipUpload(file: File, name: string): boolean {
  if (name.endsWith(".zip")) return true;
  const type = (file.type || "").toLowerCase();
  return (
    type === "application/zip" ||
    type === "application/x-zip-compressed" ||
    type === "multipart/x-zip"
  );
}

function isTxtUpload(file: File, name: string): boolean {
  if (name.endsWith(".txt")) return true;
  const type = (file.type || "").toLowerCase();
  return type.startsWith("text/") || type === "application/octet-stream";
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
        { error: "Upload a WhatsApp .txt or .zip file.", code: "NO_FILE" },
        { status: 400 },
      );
    }

    const name = (file.name || "").toLowerCase();
    const zip = isZipUpload(file, name);
    const txt = isTxtUpload(file, name);

    if (!zip && !txt) {
      return NextResponse.json(
        {
          error:
            "Please upload a WhatsApp .txt or .zip export (without media).",
          code: "BAD_TYPE",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
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

    const buffer = new Uint8Array(await file.arrayBuffer());
    let text: string;
    let storedName = file.name || (zip ? "chat.zip" : "chat.txt");

    if (zip) {
      try {
        const extracted = await extractChatTxtFromZip(buffer);
        text = extracted.text;
        storedName = extracted.sourceName;
      } catch (err) {
        if (err instanceof SafeZipError) {
          return NextResponse.json(
            { error: err.message, code: err.code },
            { status: 400 },
          );
        }
        throw err;
      }
    } else {
      text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
    }

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
            "This does not look like a WhatsApp chat export. In WhatsApp: Chat info → Export chat → Without media → upload the .txt or .zip.",
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
            "No messages found. Android exports look like: 3/2/26, 9:49 pm - Name: hi. iPhone exports use [brackets]. Export Without media as .txt or .zip.",
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
        filename: storedName,
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
    const msg = err instanceof Error ? err.message : String(err);
    const prismaCode =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: unknown }).code)
        : "";
    const unreachable =
      /Can't reach database server|PrismaClientInitializationError|DATABASE_URL|Environment variable not found/i.test(
        msg,
      ) ||
      (err &&
        typeof err === "object" &&
        "name" in err &&
        String((err as { name: unknown }).name) ===
          "PrismaClientInitializationError");
    if (
      unreachable ||
      prismaCode === "P1001" ||
      prismaCode === "P1000" ||
      prismaCode === "P1010"
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot reach the database from the server. Check DATABASE_URL / DIRECT_URL on Vercel (Neon pooler) and redeploy.",
          code: "DB_UNREACHABLE",
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
