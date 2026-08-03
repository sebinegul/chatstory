"use client";

import { TEMPLATES, type TemplateId } from "@/lib/templates/registry";

export function TemplateMiniPreview({ id }: { id: TemplateId }) {
  if (id === "minimal-ink") {
    return (
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-black px-3 py-4 text-left text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#444,transparent_55%)]" />
        <div className="relative mt-[55%]">
          <p className="text-[7px] uppercase tracking-[0.35em] text-white/50">ChatStory</p>
          <p className="mt-2 font-[family-name:var(--font-cormorant)] text-base leading-tight">
            Soft evenings
          </p>
          <div className="mt-3 h-px w-8 bg-white/40" />
          <p className="mt-3 text-[7px] text-white/45">Full-bleed cover</p>
        </div>
      </div>
    );
  }

  if (id === "pastel") {
    return (
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-[#faf3f1] px-2.5 py-3 ring-1 ring-[#d4a5a5]/60">
        <div className="mx-auto w-16 rotate-[-6deg] bg-white p-1 pb-3 shadow-sm">
          <div className="aspect-square bg-[#f3e4e2]" />
        </div>
        <div className="mt-3 rounded-2xl bg-[#f3e4e2] px-2 py-2 text-center">
          <p className="font-[family-name:var(--font-cormorant)] text-sm text-[#4a3030]">
            Soft evenings
          </p>
        </div>
        <div className="mt-2 rotate-[1deg] rounded-xl bg-white/80 px-2 py-2 shadow-sm">
          <p className="font-[family-name:var(--font-eb-garamond)] text-[10px] italic text-[#4a3030]">
            “we made it”
          </p>
        </div>
        <p className="mt-2 text-center text-[7px] text-[#9a6b6b]">Polaroid scrapbook</p>
      </div>
    );
  }

  if (id === "ghibli") {
    return (
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-gradient-to-b from-[#d4eef8] via-[#eef8f2] to-[#f7f3e8] px-2.5 py-3">
        <div className="absolute left-2 top-6 h-6 w-12 rounded-full bg-white/70" />
        <div className="absolute right-3 top-12 h-4 w-8 rounded-full bg-white/55" />
        <div className="relative mx-auto mt-8 h-20 w-16 overflow-hidden rounded-2xl border-2 border-white bg-[#b8d4c4] shadow-sm" />
        <p className="relative mt-3 text-center font-[family-name:var(--font-cormorant)] text-sm text-[#2f4a3e]">
          Soft evenings
        </p>
        <p className="relative mt-1 text-center text-[7px] text-[#5a8a9a]">Meadow · Ghibli soft</p>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#c5e0b8] to-transparent" />
      </div>
    );
  }

  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-[#f7f3ec] px-3 py-4 text-center ring-1 ring-[#b08d57]/50">
      <div className="pointer-events-none absolute inset-1.5 border border-[#b08d57]/30" />
      <p className="relative text-[7px] uppercase tracking-[0.22em] text-[#8a6b3d]">ChatStory</p>
      <div className="relative mx-auto mt-3 h-14 w-10 border border-[#b08d57]/50" />
      <p className="relative mt-3 font-[family-name:var(--font-cormorant)] text-sm text-[#1c1917]">
        Soft evenings
      </p>
      <div className="relative mx-auto mt-2 flex items-center justify-center gap-1 text-[8px] text-[#b08d57]">
        <span className="inline-block h-px w-4 bg-[#b08d57]" />
        ◆
        <span className="inline-block h-px w-4 bg-[#b08d57]" />
      </div>
      <p className="relative mt-3 text-[7px] text-[#78716c]">Ornate keepsake</p>
    </div>
  );
}

export function TemplatePicker({
  value,
  onChange,
}: {
  value: TemplateId;
  onChange: (id: TemplateId) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {TEMPLATES.map((t) => {
        const selected = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`rounded-sm border p-3 text-left transition ${
              selected
                ? "border-[var(--gold)] bg-[var(--paper-deep)] shadow-[0_0_0_1px_var(--gold)]"
                : "border-[var(--rule)] bg-transparent"
            }`}
          >
            <TemplateMiniPreview id={t.id} />
            <p className="mt-3 font-[family-name:var(--font-cormorant)] text-lg">
              {t.name}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">{t.blurb}</p>
            {selected ? (
              <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-[var(--gold-deep)]">
                Selected for PDF
              </p>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
