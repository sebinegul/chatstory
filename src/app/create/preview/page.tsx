"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StepShell } from "@/components/flow/StepShell";
import { LoadingBlock } from "@/components/flow/LoadingBlock";
import { BookViewer } from "@/components/book/BookViewer";
import type { BookPageModel } from "@/lib/ai/types";
import type { TemplateId } from "@/lib/templates/registry";
import { fileToCompressedDataUrl } from "@/lib/media";

function pageLabel(page: BookPageModel | undefined, index: number): string {
  if (!page) return `Page ${index + 1}`;
  if (page.type === "cover") return "Cover";
  if (page.type === "dedication") return "Dedication";
  if (page.type === "chapter") return page.title;
  if (page.type === "numbers") return "The Numbers";
  if (page.type === "timeline") return "Timeline";
  return `Page ${index + 1}`;
}

export default function PreviewPage() {
  const router = useRouter();
  const [pages, setPages] = useState<BookPageModel[]>([]);
  const [templateId, setTemplateId] = useState<TemplateId>("elegant-gold");
  const [isWatermarked, setIsWatermarked] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tweaking, setTweaking] = useState(false);
  const [regeneratingTitle, setRegeneratingTitle] = useState<string | null>(
    null,
  );
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaNote, setMediaNote] = useState<string | null>(null);
  const [caption, setCaption] = useState("");

  const load = useCallback(async () => {
    const sessionId = sessionStorage.getItem("chatstorySessionId");
    if (!sessionId) {
      router.replace("/create/upload");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/book?sessionId=${encodeURIComponent(sessionId)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load book");
        return;
      }
      setPages(data.pages);
      setTemplateId(data.templateId);
      setIsWatermarked(data.isWatermarked);
      setPageIndex(0);
    } catch {
      setError("Could not load book");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setCaption("");
    setMediaNote(null);
  }, [pageIndex]);

  async function patch(body: Record<string, unknown>) {
    const sessionId = sessionStorage.getItem("chatstorySessionId");
    if (!sessionId) return;
    const isRegen = body.action === "regenerate";
    setTweaking(true);
    if (isRegen && typeof body.title === "string") {
      setRegeneratingTitle(body.title);
    }
    setError(null);
    try {
      const res = await fetch("/api/chapters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, ...body }),
      });
      const data = await res.json();
      if (res.ok && data.pages) setPages(data.pages);
      else setError(data.error || "Could not update chapter");
    } catch {
      setError("Could not update chapter");
    } finally {
      setTweaking(false);
      setRegeneratingTitle(null);
    }
  }

  async function uploadForCurrentPage(file: File | null) {
    if (!file) return;
    const sessionId = sessionStorage.getItem("chatstorySessionId");
    if (!sessionId) return;
    setMediaBusy(true);
    setError(null);
    setMediaNote(
      templateId === "ghibli"
        ? "Restyling into Ghibli anime…"
        : "Adding photo…",
    );
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          pageIndex,
          dataUrl,
          caption: caption.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not add image");
        setMediaNote(null);
        return;
      }
      if (data.pages) setPages(data.pages);
      setMediaNote(
        data.stylized
          ? "Cover/photo restyled in Ghibli style."
          : "Photo added to this page.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add image");
      setMediaNote(null);
    } finally {
      setMediaBusy(false);
    }
  }

  async function removeCurrentImage() {
    const sessionId = sessionStorage.getItem("chatstorySessionId");
    if (!sessionId) return;
    setMediaBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          pageIndex,
          remove: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not remove image");
        return;
      }
      if (data.pages) setPages(data.pages);
      setMediaNote("Photo removed.");
    } catch {
      setError("Could not remove image");
    } finally {
      setMediaBusy(false);
    }
  }

  const current = pages[pageIndex];
  const hasImage = Boolean(
    current && "imageUrl" in current && current.imageUrl,
  );

  return (
    <StepShell step={5} title="Preview your book">
      {loading && <LoadingBlock label="Opening your preview..." />}
      {tweaking && (
        <p className="mb-4 text-sm text-[var(--muted)]">
          {regeneratingTitle
            ? `Rewriting “${regeneratingTitle}”…`
            : "Updating chapter…"}
        </p>
      )}
      {error && <p className="mb-4 text-sm text-[var(--danger)]">{error}</p>}
      {!loading && pages.length > 0 && (
        <>
          <BookViewer
            pages={pages}
            templateId={templateId}
            isWatermarked={isWatermarked}
            pageIndex={pageIndex}
            onPageIndexChange={setPageIndex}
            regeneratingTitle={regeneratingTitle}
            onRename={(fromTitle, toTitle) =>
              void patch({ action: "rename", fromTitle, toTitle })
            }
            onReorder={(order) => void patch({ action: "reorder", order })}
            onRegenerate={(title) =>
              void patch({ action: "regenerate", title })
            }
          />

          <div className="mt-10 rounded-sm border border-[var(--rule)] p-5">
            <p className="font-[family-name:var(--font-dm)] text-xs uppercase tracking-[0.18em] text-[var(--gold-deep)]">
              Photos on this page
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Flip to a page, then add a photo. Current:{" "}
              <span className="text-[var(--ink)]">
                {pageLabel(current, pageIndex)}
              </span>
              {templateId === "ghibli"
                ? " — Ghibli Soft will restyle uploads into anime."
                : "."}
            </p>

            <label className="mt-4 block text-sm">
              <span className="text-[var(--muted)]">Caption (optional)</span>
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={80}
                disabled={mediaBusy}
                className="mt-1 w-full rounded-sm border border-[var(--rule)] bg-transparent px-3 py-2"
                placeholder={
                  current?.type === "cover" ? "Cover photo" : "e.g. That Sunday"
                }
              />
            </label>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="btn-ghost cursor-pointer rounded-full px-4 py-2 text-sm">
                {mediaBusy ? "Working…" : hasImage ? "Replace photo" : "Add photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={mediaBusy}
                  onChange={(e) => {
                    void uploadForCurrentPage(e.target.files?.[0] || null);
                    e.target.value = "";
                  }}
                />
              </label>
              {hasImage && (
                <button
                  type="button"
                  disabled={mediaBusy}
                  onClick={() => void removeCurrentImage()}
                  className="text-xs uppercase tracking-wider text-[var(--muted)] disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </div>
            {mediaNote && (
              <p className="mt-3 text-xs text-[var(--muted)]">{mediaNote}</p>
            )}
            {hasImage && current && "imageUrl" in current && current.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.imageUrl}
                alt="Page photo"
                className="mt-4 h-36 w-28 rounded-sm object-cover"
              />
            ) : null}
          </div>
        </>
      )}
      <button
        type="button"
        onClick={() => router.push("/create/pay")}
        disabled={loading || pages.length === 0}
        className="mt-10 btn-primary cursor-pointer px-6 py-3 text-sm disabled:opacity-60"
      >
        Unlock full book — Rs.49
      </button>
    </StepShell>
  );
}
