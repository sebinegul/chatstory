import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionOrThrow } from "@/lib/session";
import type { BookPageModel } from "@/lib/ai/types";
import { stylizeImageGhibli } from "@/lib/ai/ghibli-style";
import { normalizeTemplateId } from "@/lib/templates/registry";
import type { ExtraBookImage } from "@/lib/media";

function isDataUrlImage(value: string): boolean {
  return /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(value);
}

function setPageImage(
  pages: BookPageModel[],
  pageIndex: number,
  dataUrl: string | undefined,
  caption?: string,
): BookPageModel[] {
  if (pageIndex < 0 || pageIndex >= pages.length) return pages;
  return pages.map((p, i) => {
    if (i !== pageIndex) return p;
    if (!dataUrl) {
      const next = { ...p } as BookPageModel & {
        imageUrl?: string;
        imageCaption?: string;
      };
      delete next.imageUrl;
      delete next.imageCaption;
      return next;
    }
    return {
      ...p,
      imageUrl: dataUrl,
      imageCaption: caption?.trim() || undefined,
    } as BookPageModel;
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, pageIndex, dataUrl, caption, remove } = body as {
      sessionId?: string;
      pageIndex?: number;
      dataUrl?: string;
      caption?: string;
      remove?: boolean;
    };

    if (!sessionId || typeof pageIndex !== "number" || pageIndex < 0) {
      return NextResponse.json(
        { error: "sessionId and pageIndex required" },
        { status: 400 },
      );
    }

    await getSessionOrThrow(sessionId);
    const book = await prisma.book.findUnique({ where: { sessionId } });
    const config = await prisma.bookConfig.findUnique({ where: { sessionId } });
    if (!book || !config) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    let pages = JSON.parse(book.pagesJson) as BookPageModel[];
    if (pageIndex >= pages.length) {
      return NextResponse.json({ error: "Invalid page" }, { status: 400 });
    }

    const templateId = normalizeTemplateId(config.templateId) || "elegant-gold";
    const page = pages[pageIndex];
    const isCover = page.type === "cover";

    if (remove) {
      pages = setPageImage(pages, pageIndex, undefined);
      let coverImage = config.coverImage || "";
      let media = [] as ExtraBookImage[];
      try {
        media = JSON.parse(config.mediaJson || "[]") as ExtraBookImage[];
      } catch {
        media = [];
      }
      if (isCover) coverImage = "";
      else {
        // Drop matching extra by dataUrl if present
        const removedUrl =
          "imageUrl" in page ? (page as { imageUrl?: string }).imageUrl : undefined;
        media = media.filter((m) => m.dataUrl !== removedUrl);
      }
      await prisma.$transaction([
        prisma.book.update({
          where: { sessionId },
          data: { pagesJson: JSON.stringify(pages) },
        }),
        prisma.bookConfig.update({
          where: { sessionId },
          data: {
            coverImage,
            mediaJson: JSON.stringify(media),
          },
        }),
      ]);
      return NextResponse.json({
        ok: true,
        pages,
        stylized: false,
        templateId,
      });
    }

    if (!dataUrl || !isDataUrlImage(dataUrl)) {
      return NextResponse.json(
        { error: "Valid image required (JPEG/PNG/WebP data URL)" },
        { status: 400 },
      );
    }
    if (dataUrl.length > 2_500_000) {
      return NextResponse.json(
        { error: "Image too large. Try a smaller photo." },
        { status: 400 },
      );
    }

    let finalUrl = dataUrl;
    let stylized = false;
    if (templateId === "ghibli") {
      const before = finalUrl;
      finalUrl = await stylizeImageGhibli(dataUrl);
      stylized = finalUrl !== before && finalUrl.startsWith("data:image/");
      if (!stylized) {
        return NextResponse.json(
          {
            error:
              "Could not restyle into Ghibli anime. Check OPENROUTER_API_KEY / image model access, then try again.",
            pages,
            stylized: false,
          },
          { status: 502 },
        );
      }
    }

    pages = setPageImage(pages, pageIndex, finalUrl, caption);

    let coverImage = config.coverImage || "";
    let media = [] as ExtraBookImage[];
    try {
      media = JSON.parse(config.mediaJson || "[]") as ExtraBookImage[];
    } catch {
      media = [];
    }

    if (isCover) {
      coverImage = finalUrl;
    } else {
      // Keep up to 2 extras keyed loosely for re-generate
      const entry: ExtraBookImage = {
        dataUrl: finalUrl,
        placement: page.type === "dedication" ? "dedication" : "middle-chapter",
        caption: caption?.trim() || undefined,
      };
      const withoutDup = media.filter((m) => m.dataUrl !== finalUrl);
      media = [...withoutDup, entry].slice(-2);
    }

    await prisma.$transaction([
      prisma.book.update({
        where: { sessionId },
        data: { pagesJson: JSON.stringify(pages) },
      }),
      prisma.bookConfig.update({
        where: { sessionId },
        data: {
          coverImage,
          mediaJson: JSON.stringify(media),
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      pages,
      stylized,
      templateId,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Could not save image" },
      { status: 500 },
    );
  }
}
