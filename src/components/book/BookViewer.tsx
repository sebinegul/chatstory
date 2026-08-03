"use client";

import { useMemo, useState } from "react";
import type { BookPageModel } from "@/lib/ai/types";
import type { TemplateId } from "@/lib/templates/registry";
import { BookPage } from "./BookPage";
import { Watermark } from "./Watermark";

export function BookViewer({
  pages,
  templateId,
  isWatermarked,
  onRename,
  onReorder,
  onRegenerate,
}: {
  pages: BookPageModel[];
  templateId: TemplateId;
  isWatermarked: boolean;
  onRename?: (fromTitle: string, toTitle: string) => void;
  onReorder?: (order: string[]) => void;
  onRegenerate?: (title: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const page = pages[index];
  const chapterTitles = useMemo(
    () =>
      pages.filter((p) => p.type === "chapter").map((p) => (p.type === "chapter" ? p.title : "")),
    [pages],
  );

  if (!page) return null;

  return (
    <div>
      <div id="book-root" className="relative">
        <Watermark show={isWatermarked} />
        <BookPage page={page} index={index} templateId={templateId} />
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="rounded-sm border border-[var(--rule)] px-4 py-2 text-sm disabled:opacity-40"
        >
          Previous
        </button>
        <p className="text-sm text-[var(--muted)]">
          Page {index + 1} of {pages.length}
        </p>
        <button
          type="button"
          disabled={index >= pages.length - 1}
          onClick={() => setIndex((i) => Math.min(pages.length - 1, i + 1))}
          className="rounded-sm border border-[var(--rule)] px-4 py-2 text-sm disabled:opacity-40"
        >
          Next
        </button>
      </div>

      {isWatermarked && onRename && onReorder && onRegenerate ? (
        <div className="mt-10 rounded-sm border border-[var(--rule)] p-5">
          <p className="font-[family-name:var(--font-jost)] text-xs uppercase tracking-[0.18em] text-[var(--gold-deep)]">
            Tweak chapters
          </p>
          <ul className="mt-4 space-y-3">
            {chapterTitles.map((title, i) => (
              <li key={`${title}-${i}`} className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 font-[family-name:var(--font-eb-garamond)] text-lg">
                  {title}
                </span>
                <button
                  type="button"
                  className="text-xs uppercase tracking-wider text-[var(--muted)]"
                  onClick={() => {
                    const next = prompt("Rename chapter", title);
                    if (next && next !== title) onRename(title, next);
                  }}
                >
                  Rename
                </button>
                <button
                  type="button"
                  className="text-xs uppercase tracking-wider text-[var(--muted)]"
                  disabled={i === 0}
                  onClick={() => {
                    const order = [...chapterTitles];
                    [order[i - 1], order[i]] = [order[i], order[i - 1]];
                    onReorder(order);
                  }}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="text-xs uppercase tracking-wider text-[var(--muted)]"
                  onClick={() => onRegenerate(title)}
                >
                  Regenerate
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
