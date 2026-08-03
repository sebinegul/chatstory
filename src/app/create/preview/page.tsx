"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StepShell } from "@/components/flow/StepShell";
import { BookViewer } from "@/components/book/BookViewer";
import type { BookPageModel } from "@/lib/ai/types";
import type { TemplateId } from "@/lib/templates/registry";

export default function PreviewPage() {
  const router = useRouter();
  const [pages, setPages] = useState<BookPageModel[]>([]);
  const [templateId, setTemplateId] = useState<TemplateId>("elegant-gold");
  const [isWatermarked, setIsWatermarked] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sessionId = sessionStorage.getItem("chatstorySessionId");
    if (!sessionId) {
      router.replace("/create/upload");
      return;
    }
    const res = await fetch(`/api/book?sessionId=${encodeURIComponent(sessionId)}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not load book");
      return;
    }
    setPages(data.pages);
    setTemplateId(data.templateId);
    setIsWatermarked(data.isWatermarked);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(body: Record<string, unknown>) {
    const sessionId = sessionStorage.getItem("chatstorySessionId");
    if (!sessionId) return;
    const res = await fetch("/api/chapters", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, ...body }),
    });
    const data = await res.json();
    if (res.ok && data.pages) setPages(data.pages);
  }

  return (
    <StepShell step={5} title="Preview your book">
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {pages.length > 0 && (
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
        className="mt-10 rounded-sm bg-[var(--gold-deep)] px-6 py-3 text-sm text-[var(--paper)]"
      >
        Unlock full book — Rs.49
      </button>
    </StepShell>
  );
}
