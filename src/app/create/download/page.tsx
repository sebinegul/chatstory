"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StepShell } from "@/components/flow/StepShell";
import { BookViewer } from "@/components/book/BookViewer";
import { downloadBookPdf } from "@/lib/pdf/client-download";
import type { BookPageModel } from "@/lib/ai/types";
import type { TemplateId } from "@/lib/templates/registry";

export default function DownloadPage() {
  const router = useRouter();
  const [pages, setPages] = useState<BookPageModel[]>([]);
  const [templateId, setTemplateId] = useState<TemplateId>("elegant-gold");
  const [title, setTitle] = useState("chatstory");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    if (data.isWatermarked) {
      router.replace("/create/pay");
      return;
    }
    setPages(data.pages);
    setTemplateId(data.templateId);
    setTitle(data.title || "chatstory");
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onDownload() {
    setBusy(true);
    setError(null);
    try {
      await downloadBookPdf("book-root", `${title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    const sessionId = sessionStorage.getItem("chatstorySessionId");
    if (!sessionId) return;
    await fetch("/api/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    sessionStorage.removeItem("chatstorySessionId");
    sessionStorage.removeItem("chatstoryParticipants");
    router.push("/");
  }

  return (
    <StepShell step={6} title="Your book is unlocked">
      {pages.length > 0 && (
        <BookViewer
          pages={pages}
          templateId={templateId}
          isWatermarked={false}
        />
      )}
      {error && <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>}
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void onDownload()}
          disabled={busy}
          className="rounded-sm bg-[var(--gold-deep)] px-6 py-3 text-sm text-[var(--paper)] disabled:opacity-60"
        >
          {busy ? "Preparing PDF..." : "Download PDF"}
        </button>
        <button
          type="button"
          onClick={() => void onDelete()}
          className="rounded-sm border border-[var(--rule)] px-6 py-3 text-sm text-[var(--danger)]"
        >
          Delete now
        </button>
      </div>
    </StepShell>
  );
}
