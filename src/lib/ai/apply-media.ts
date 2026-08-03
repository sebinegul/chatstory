import type { ExtraBookImage, ImagePlacement } from "@/lib/media";
import type { BookPageModel, GeneratedBook } from "./types";

function chapterIndexes(pages: BookPageModel[]): number[] {
  const idxs: number[] = [];
  pages.forEach((p, i) => {
    if (p.type === "chapter") idxs.push(i);
  });
  return idxs;
}

function findPageIndex(pages: BookPageModel[], placement: ImagePlacement): number {
  const chapters = chapterIndexes(pages);
  if (placement === "dedication") {
    return pages.findIndex((p) => p.type === "dedication");
  }
  if (placement === "numbers") {
    return pages.findIndex((p) => p.type === "numbers");
  }
  if (placement === "timeline") {
    return pages.findIndex((p) => p.type === "timeline");
  }
  if (placement === "first-chapter") {
    return chapters[0] ?? -1;
  }
  if (placement === "last-chapter") {
    return chapters[chapters.length - 1] ?? -1;
  }
  if (placement === "middle-chapter") {
    if (chapters.length === 0) return -1;
    return chapters[Math.floor(chapters.length / 2)] ?? -1;
  }
  return -1;
}

export function applyBookMedia(
  book: GeneratedBook,
  coverImage?: string,
  extraImages: ExtraBookImage[] = [],
): GeneratedBook {
  const pages = book.pages.map((p) => ({ ...p }));

  if (coverImage) {
    const coverIdx = pages.findIndex((p) => p.type === "cover");
    if (coverIdx >= 0 && pages[coverIdx].type === "cover") {
      pages[coverIdx] = { ...pages[coverIdx], imageUrl: coverImage };
    }
  }

  for (const img of extraImages.slice(0, 2)) {
    if (!img?.dataUrl) continue;
    const idx = findPageIndex(pages, img.placement);
    if (idx < 0) continue;
    const page = pages[idx];
    pages[idx] = {
      ...page,
      imageUrl: img.dataUrl,
      imageCaption: img.caption || undefined,
    } as BookPageModel;
  }

  return { ...book, pages };
}
