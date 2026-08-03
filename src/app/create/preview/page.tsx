"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StepShell } from "@/components/flow/StepShell";
import { LoadingBlock } from "@/components/flow/LoadingBlock";
import { BookViewer } from "@/components/book/BookViewer";
import type { BookPageModel } from "@/lib/ai/types";
import type { TemplateId } from "@/lib/templates/registry";

export default function PreviewPage() {
  const router = useRouter();
  const [pages, setPages] = useState<BookPageModel[]>([]);
  const [templateId, setTemplateId] = useState<TemplateId>("elegant-gold");
  const [isWatermarked, setIsWatermarked] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tweaking, setTweaking] = useState(false);

  const load = useCallback(async () => {
    const sessionId = sessionStorage.getItem("chatstorySessionId");
    if (!sessionId) {
      router.replace("/create/upload");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/book?sessionId=${encodeURIComponent(sessionId)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load book");
        return;
      }
      setPages(data.pages);
      setTemplateId(data.templateId);
      setIsWatermarked(data.isWatermarked);
    } catch {
      setError("Could not load book");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(body: Record<string, unknown>) {
    const sessionId = sessionStorage.getItem("chatstorySessionId");
    if (!sessionId) return;
    setTweaking(true);
    try {
      const res = await fetch("/api/chapters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, ...body }),
      });
      const data = await res.json();
      if (res.ok && data.pages) setPages(data.pages);
      else setError(data.error || "Could not update chapter");
    } finally {
      setTweaking(false);
    }
  }

  return (
    <StepShell step={5} title="Preview your book">
      {loading && <LoadingBlock label="Opening your preview..." />}
      {tweaking && (
        <p className="mb-4 text-sm text-[var(--muted)]">Updating chapter...</p>
      )}
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {!loading && pages.length > 0 && (
        <BookViewer
          pages={pages}
          templateId={templateId}
          isWatermarked={isWatermarked}
          onRename={(fromTitle, toTitle) =>
            void patch({ action: "rename", fromTitle, toTitle })
          }
          onReorder={(order) => void patch({ action: "reorder", order })}
          onRegenerate={(title) => void patch({ action: "regenerate", title })}
        />
      )}
      <button
        type="button"
        onClick={() => router.push("/create/pay")}
        disabled={loading || pages.length === 0}
        className="mt-10 rounded-sm bg-[var(--gold-deep)] px-6 py-3 text-sm text-[var(--paper)] disabled:opacity-60"
      >
        Unlock full book — Rs.49
      </button>
    </StepShell>
  );
}
