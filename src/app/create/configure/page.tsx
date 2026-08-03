"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StepShell } from "@/components/flow/StepShell";
import { TemplatePicker } from "@/components/configure/TemplatePicker";
import type { TemplateId } from "@/lib/templates/registry";
import {
  RELATIONSHIPS,
  type RelationshipId,
} from "@/lib/relationships";

type SpecialDate = { label: string; date: string };
type ChapterDraft = { title: string; startAt: string; endAt: string };

export default function ConfigurePage() {
  const router = useRouter();
  const [personA, setPersonA] = useState("");
  const [personB, setPersonB] = useState("");
  const [relationship, setRelationship] = useState<RelationshipId>("couple");
  const [aiChooses, setAiChooses] = useState(true);
  const [templateId, setTemplateId] = useState<TemplateId>("elegant-gold");
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([
    { label: "First meeting", date: "" },
  ]);
  const [chapters, setChapters] = useState<ChapterDraft[]>([
    { title: "How it started", startAt: "", endAt: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("chatstoryParticipants");
    if (!raw) return;
    try {
      const parts = JSON.parse(raw) as string[];
      if (parts[0]) setPersonA(parts[0]);
      if (parts[1]) setPersonB(parts[1]);
    } catch {
      /* ignore */
    }
  }, []);

  async function submit() {
    setError(null);
    const sessionId = sessionStorage.getItem("chatstorySessionId");
    if (!sessionId) {
      router.replace("/create/upload");
      return;
    }
    if (!personA.trim() || !personB.trim()) {
      setError("Enter both names.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          personA: personA.trim(),
          personB: personB.trim(),
          relationship,
          specialDates: specialDates.filter((d) => d.date && d.label),
          chapters: aiChooses
            ? []
            : chapters
                .filter((c) => c.title)
                .slice(0, 15)
                .map((c) => ({
                  title: c.title,
                  startAt: c.startAt || new Date().toISOString(),
                  endAt: c.endAt || c.startAt || new Date().toISOString(),
                })),
          aiChooses,
          templateId,
          coverImage: "",
          extraImages: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      router.push("/create/generating");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <StepShell step={3} title="Shape your book">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-[var(--muted)]">Person one</span>
          <input
            value={personA}
            onChange={(e) => setPersonA(e.target.value)}
            className="mt-1 w-full rounded-sm border border-[var(--rule)] bg-[var(--surface)] px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--muted)]">Person two</span>
          <input
            value={personB}
            onChange={(e) => setPersonB(e.target.value)}
            className="mt-1 w-full rounded-sm border border-[var(--rule)] bg-[var(--surface)] px-3 py-2"
          />
        </label>
      </div>

      <label className="mt-8 block text-sm">
        <span className="text-[var(--muted)]">What is this relationship?</span>
        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value as RelationshipId)}
          className="mt-1 w-full rounded-sm border border-[var(--rule)] bg-[var(--surface)] px-3 py-2"
        >
          {RELATIONSHIPS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <span className="mt-2 block text-xs text-[var(--muted)]">
          {RELATIONSHIPS.find((r) => r.id === relationship)?.blurb}
        </span>
      </label>

      <div className="mt-8">
        <p className="text-sm text-[var(--muted)]">Special dates (scanned ±2 days)</p>
        <div className="mt-3 space-y-3">
          {specialDates.map((d, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-2">
              <input
                placeholder="Label"
                value={d.label}
                onChange={(e) => {
                  const next = [...specialDates];
                  next[i] = { ...d, label: e.target.value };
                  setSpecialDates(next);
                }}
                className="rounded-sm border border-[var(--rule)] bg-[var(--surface)] px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={d.date}
                onChange={(e) => {
                  const next = [...specialDates];
                  next[i] = { ...d, date: e.target.value };
                  setSpecialDates(next);
                }}
                className="rounded-sm border border-[var(--rule)] bg-[var(--surface)] px-3 py-2 text-sm"
              />
            </div>
          ))}
          {specialDates.length < 10 && (
            <button
              type="button"
              className="text-sm text-[var(--accent)]"
              onClick={() =>
                setSpecialDates([...specialDates, { label: "", date: "" }])
              }
            >
              Add date
            </button>
          )}
        </div>
      </div>

      <div className="mt-8">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={aiChooses}
            onChange={(e) => setAiChooses(e.target.checked)}
            className="accent-[var(--accent)]"
          />
          AI chooses chapters for me
        </label>
        {!aiChooses && (
          <div className="mt-4 space-y-3">
            {chapters.map((c, i) => (
              <input
                key={i}
                value={c.title}
                placeholder={`Chapter ${i + 1} title`}
                onChange={(e) => {
                  const next = [...chapters];
                  next[i] = { ...c, title: e.target.value };
                  setChapters(next);
                }}
                className="w-full rounded-sm border border-[var(--rule)] bg-[var(--surface)] px-3 py-2 text-sm"
              />
            ))}
            {chapters.length < 15 && (
              <button
                type="button"
                className="text-sm text-[var(--accent)]"
                onClick={() =>
                  setChapters([
                    ...chapters,
                    { title: "", startAt: "", endAt: "" },
                  ])
                }
              >
                Add chapter
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-8">
        <p className="mb-3 text-sm text-[var(--muted)]">
          Template — each design is a different book layout
        </p>
        <TemplatePicker value={templateId} onChange={setTemplateId} />
        {templateId === "ghibli" ? (
          <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
            After preview, you can add photos — Ghibli Soft restyles them into a
            painted anime look.
          </p>
        ) : (
          <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
            You can place cover and page photos after the story preview is ready.
          </p>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="mt-8 btn-primary cursor-pointer px-6 py-3 text-sm disabled:opacity-60"
      >
        {busy ? "Saving..." : "Build my book"}
      </button>
    </StepShell>
  );
}
