"use client";

import { TEMPLATES, type TemplateId } from "@/lib/templates/registry";

export function TemplateMiniPreview({ id }: { id: TemplateId }) {
  if (id === "minimal-ink") {
    return (
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-black px-3 py-4 text-left text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#444,transparent_55%)]" />
        <div className="relative mt-[55%]">
          <p className="text-[7px] uppercase tracking-[0.35em] text-white/50">Still yours</p>
          <p className="mt-2 font-[family-name:var(--font-cormorant)] text-base leading-tight">
            Soft evenings
          </p>
          <div className="mt-3 h-px w-8 bg-white/40" />
          <p className="mt-3 text-[7px] text-white/45">Quiet Type</p>
        </div>
      </div>
    );
  }

  if (id === "cute") {
    return (
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-[#fff5f7] px-2.5 py-3">
        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-[#ffd6e0]" />
        <div className="relative mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#ffd6e0] text-2xl text-[#e8788c]">
          ♡
        </div>
        <p className="relative mt-3 text-center font-[family-name:var(--font-cormorant)] text-sm text-[#5a3040]">
          Soft evenings
        </p>
        <p className="relative mt-1 text-center text-[7px] text-[#e8788c]">Honey Heart</p>
      </div>
    );
  }

  if (id === "ghibli") {
    return (
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-gradient-to-b from-[#cfeaf6] via-[#e8f6ef] to-[#d9e8c4] px-2.5 py-3">
        <div className="absolute left-2 top-6 h-6 w-12 rounded-full bg-white/70" />
        <div className="absolute right-3 top-12 h-4 w-8 rounded-full bg-white/55" />
        <div className="relative mx-auto mt-8 h-20 w-16 overflow-hidden rounded-2xl border-2 border-white bg-[#b8d4c4] shadow-sm" />
        <p className="relative mt-3 text-center font-[family-name:var(--font-cormorant)] text-sm text-[#2f4a3e]">
          Soft evenings
        </p>
        <p className="relative mt-1 text-center text-[7px] text-[#5a8a9a]">Ghibli Soft</p>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#b7d59a] to-transparent" />
      </div>
    );
  }

  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-[#f7f3ec] px-3 py-4 text-center ring-1 ring-[#b08d57]/50">
      <div className="pointer-events-none absolute inset-1.5 border border-[#b08d57]/30" />
      <p className="relative text-[7px] uppercase tracking-[0.22em] text-[#8a6b3d]">
        A private keepsake
      </p>
      <div className="relative mx-auto mt-3 h-14 w-10 border border-[#b08d57]/50" />
      <p className="relative mt-3 font-[family-name:var(--font-cormorant)] text-sm text-[#1c1917]">
        Soft evenings
      </p>
      <div className="relative mx-auto mt-2 flex items-center justify-center gap-1 text-[8px] text-[#b08d57]">
        <span className="inline-block h-px w-4 bg-[#b08d57]" />
        ◆
        <span className="inline-block h-px w-4 bg-[#b08d57]" />
      </div>
      <p className="relative mt-3 text-[7px] text-[#78716c]">Velvet Letter</p>
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
            className={`cursor-pointer rounded-[1.25rem] border p-3 text-left transition ${
              selected
                ? "border-[#2dd4bf]/60 bg-[rgba(45,212,191,0.08)] shadow-[0_0_0_1px_rgba(45,212,191,0.35)]"
                : "border-[var(--rule)] bg-transparent hover:border-white/20"
            }`}
          >
            <TemplateMiniPreview id={t.id} />
            <p className="mt-3 font-[family-name:var(--font-space)] text-lg font-semibold">
              {t.name}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">{t.blurb}</p>
            {selected ? (
              <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-[#2dd4bf]">
                Selected for PDF
              </p>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
