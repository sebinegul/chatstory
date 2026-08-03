"use client";

import { TEMPLATES, type TemplateId } from "@/lib/templates/registry";

export function TemplatePicker({
  value,
  onChange,
}: {
  value: TemplateId;
  onChange: (id: TemplateId) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {TEMPLATES.map((t) => {
        const selected = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`rounded-sm border px-4 py-4 text-left transition ${
              selected
                ? "border-[var(--gold)] bg-[var(--paper-deep)]"
                : "border-[var(--rule)] bg-transparent"
            }`}
          >
            <div
              className={`mb-3 h-16 rounded-sm ${
                t.id === "elegant-gold"
                  ? "bg-[#f4efe4] ring-1 ring-[var(--gold)]"
                  : t.id === "minimal-ink"
                    ? "bg-white ring-1 ring-black/20"
                    : "bg-[#f6e9ea] ring-1 ring-[#d4a5a5]"
              }`}
            />
            <p className="font-[family-name:var(--font-cormorant)] text-lg">
              {t.name}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">{t.blurb}</p>
          </button>
        );
      })}
    </div>
  );
}
