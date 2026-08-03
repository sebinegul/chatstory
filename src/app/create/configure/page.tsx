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
import {
  IMAGE_PLACEMENTS,
  fileToCompressedDataUrl,
  type ExtraBookImage,
  type ImagePlacement,
} from "@/lib/media";

type SpecialDate = { label: string; date: string };
type ChapterDraft = { title: string; startAt: string; endAt: string };
type ExtraDraft = {
  dataUrl: string;
  placement: ImagePlacement;
  caption: string;
};

export default function ConfigurePage() {
  const router = useRouter();
  const [personA, setPersonA] = useState("");
  const [personB, setPersonB] = useState("");
  const [relationship, setRelationship] = useState<RelationshipId>("couple");
  const [keyword, setKeyword] = useState("");
  const [aiChooses, setAiChooses] = useState(true);
  const [templateId, setTemplateId] = useState<TemplateId>("elegant-gold");
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([
    { label: "First meeting", date: "" },
  ]);
  const [chapters, setChapters] = useState<ChapterDraft[]>([
    { title: "How it started", startAt: "", endAt: "" },
  ]);
  const [coverImage, setCoverImage] = useState("");
  const [extras, setExtras] = useState<ExtraDraft[]>([
    { dataUrl: "", placement: "first-chapter", caption: "" },
    { dataUrl: "", placement: "last-chapter", caption: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [compressing, setCompressing] = useState<string | null>(null);

  useEffect(() => {
    const savedKw = sessionStorage.getItem("chatstoryKeyword");
    if (savedKw) setKeyword(savedKw);
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

  async function onCoverFile(file: File | null) {
    if (!file) {
      setCoverImage("");
      return;
    }
    setCompressing("cover");
    setError(null);
    try {
      setCoverImage(await fileToCompressedDataUrl(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read cover image");
      setCoverImage("");
    } finally {
      setCompressing(null);
    }
  }

  async function onExtraFile(index: number, file: File | null) {
    if (!file) {
      setExtras((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], dataUrl: "" };
        return next;
      });
      return;
    }
    setCompressing(`extra-${index}`);
    setError(null);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setExtras((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], dataUrl };
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read image");
    } finally {
      setCompressing(null);
    }
  }

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
      const extraImages: ExtraBookImage[] = extras
        .filter((e) => e.dataUrl)
        .map((e) => ({
          dataUrl: e.dataUrl,
          placement: e.placement,
          caption: e.caption.trim() || undefined,
        }));

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
          keyword,
          coverImage: coverImage || "",
          extraImages,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      sessionStorage.setItem("chatstoryKeyword", keyword.trim());
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
            className="mt-1 w-full rounded-sm border border-[var(--rule)] bg-transparent px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--muted)]">Person two</span>
          <input
            value={personB}
            onChange={(e) => setPersonB(e.target.value)}
            className="mt-1 w-full rounded-sm border border-[var(--rule)] bg-transparent px-3 py-2"
          />
        </label>
      </div>

      <label className="mt-8 block text-sm">
        <span className="text-[var(--muted)]">What is this relationship?</span>
        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value as RelationshipId)}
          className="mt-1 w-full rounded-sm border border-[var(--rule)] bg-[var(--paper)] px-3 py-2"
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
                className="rounded-sm border border-[var(--rule)] bg-transparent px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={d.date}
                onChange={(e) => {
                  const next = [...specialDates];
                  next[i] = { ...d, date: e.target.value };
                  setSpecialDates(next);
                }}
                className="rounded-sm border border-[var(--rule)] bg-transparent px-3 py-2 text-sm"
              />
            </div>
          ))}
          {specialDates.length < 10 && (
            <button
              type="button"
              className="text-sm text-[var(--gold-deep)]"
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
            className="accent-[var(--gold-deep)]"
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
                className="w-full rounded-sm border border-[var(--rule)] bg-transparent px-3 py-2 text-sm"
              />
            ))}
            {chapters.length < 15 && (
              <button
                type="button"
                className="text-sm text-[var(--gold-deep)]"
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
            Ghibli Soft restyles your cover and extra photos into a painted
            anime look when the book is generated (needs OpenRouter image access).
          </p>
        ) : null}
      </div>

      <div className="mt-10 border-t border-[var(--rule)] pt-8">
        <p className="font-[family-name:var(--font-cormorant)] text-2xl">Photos</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Optional. Cover plus up to two more images placed on pages you choose.
        </p>

        <label className="mt-6 block text-sm">
          <span className="text-[var(--muted)]">Cover image</span>
          <input
            type="file"
            accept="image/*"
            className="mt-2 block w-full text-sm"
            onChange={(e) => onCoverFile(e.target.files?.[0] || null)}
          />
          {compressing === "cover" && (
            <span className="mt-2 block text-xs text-[var(--muted)]">Compressing…</span>
          )}
          {coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt="Cover preview"
              className="mt-3 h-40 w-32 rounded-sm object-cover"
            />
          )}
        </label>

        {extras.map((extra, i) => (
          <div key={i} className="mt-8 rounded-sm border border-[var(--rule)] p-4">
            <p className="text-sm text-[var(--muted)]">Extra image {i + 1}</p>
            <input
              type="file"
              accept="image/*"
              className="mt-2 block w-full text-sm"
              onChange={(e) => onExtraFile(i, e.target.files?.[0] || null)}
            />
            {compressing === `extra-${i}` && (
              <span className="mt-2 block text-xs text-[var(--muted)]">Compressing…</span>
            )}
            <label className="mt-3 block text-sm">
              <span className="text-[var(--muted)]">Place on</span>
              <select
                value={extra.placement}
                onChange={(e) => {
                  const next = [...extras];
                  next[i] = {
                    ...extra,
                    placement: e.target.value as ImagePlacement,
                  };
                  setExtras(next);
                }}
                className="mt-1 w-full rounded-sm border border-[var(--rule)] bg-[var(--paper)] px-3 py-2"
              >
                {IMAGE_PLACEMENTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-sm">
              <span className="text-[var(--muted)]">Caption (optional)</span>
              <input
                value={extra.caption}
                onChange={(e) => {
                  const next = [...extras];
                  next[i] = { ...extra, caption: e.target.value };
                  setExtras(next);
                }}
                className="mt-1 w-full rounded-sm border border-[var(--rule)] bg-transparent px-3 py-2"
                placeholder="e.g. That Sunday"
                maxLength={80}
              />
            </label>
            {extra.dataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={extra.dataUrl}
                alt={`Extra ${i + 1} preview`}
                className="mt-3 h-28 w-40 rounded-sm object-cover"
              />
            )}
          </div>
        ))}
      </div>

      <label className="mt-8 block text-sm">
        <span className="text-[var(--muted)]">
          Keyword to celebrate (shapes the whole book)
        </span>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="mt-1 w-full rounded-sm border border-[var(--rule)] bg-transparent px-3 py-2"
          placeholder="Auto-detected from your chat"
        />
        <span className="mt-2 block text-xs text-[var(--muted)]">
          Titles, narration, and the Numbers page will orbit this word.
        </span>
      </label>

      {error && <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={busy || !!compressing}
        className="mt-8 rounded-sm bg-[var(--gold-deep)] px-6 py-3 text-sm text-[var(--paper)] disabled:opacity-60"
      >
        {busy ? "Saving..." : "Build my book"}
      </button>
    </StepShell>
  );
}
