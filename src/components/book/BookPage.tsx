"use client";

import type { BookPageModel } from "@/lib/ai/types";
import type { TemplateId } from "@/lib/templates/registry";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function BookPage({
  page,
  index,
  templateId,
}: {
  page: BookPageModel;
  index: number;
  templateId: TemplateId;
}) {
  const theme =
    templateId === "minimal-ink"
      ? "book-minimal"
      : templateId === "pastel"
        ? "book-pastel"
        : "book-gold";

  return (
    <article
      className={`book-page ${theme} relative mx-auto flex min-h-[70vh] w-full max-w-[42rem] flex-col px-8 py-10 sm:px-12`}
    >
      {page.type === "cover" && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--gold-deep)]">
            ChatStory
          </p>
          <h2 className="mt-6 font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl">
            {page.title}
          </h2>
          {page.subtitle && (
            <p className="mt-4 font-[family-name:var(--font-eb-garamond)] text-lg text-[var(--ink-soft)]">
              {page.subtitle}
            </p>
          )}
        </div>
      )}

      {page.type === "dedication" && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="max-w-md font-[family-name:var(--font-eb-garamond)] text-xl italic leading-relaxed">
            {page.text}
          </p>
        </div>
      )}

      {page.type === "chapter" && (
        <div className="flex flex-1 flex-col">
          <h2 className="text-center font-[family-name:var(--font-cormorant)] text-3xl">
            {page.title}
          </h2>
          <div className="mx-auto mt-3 h-px w-24 bg-[var(--gold)]" />
          <p className="mt-8 font-[family-name:var(--font-eb-garamond)] text-lg leading-relaxed text-[var(--ink-soft)]">
            {page.narration}
          </p>
          <div className="mt-8 space-y-6">
            {page.quotes.map((q, i) => (
              <blockquote key={`${q.at}-${i}`} className="border-l border-[var(--gold)] pl-4">
                <p className="font-[family-name:var(--font-eb-garamond)] text-xl leading-relaxed">
                  “{q.text}”
                </p>
                <footer className="mt-2 text-sm text-[var(--muted)]">
                  {q.author} · {formatWhen(q.at)}
                </footer>
              </blockquote>
            ))}
          </div>
          {page.milestone && (
            <p className="mt-8 text-center text-xs uppercase tracking-[0.18em] text-[var(--gold-deep)]">
              {page.milestone}
            </p>
          )}
        </div>
      )}

      {page.type === "numbers" && (
        <div className="flex flex-1 flex-col justify-center">
          <h2 className="text-center font-[family-name:var(--font-cormorant)] text-3xl">
            The Numbers
          </h2>
          <div className="mx-auto mt-3 h-px w-24 bg-[var(--gold)]" />
          <dl className="mt-10 grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-[var(--muted)]">Messages</dt>
              <dd className="font-[family-name:var(--font-cormorant)] text-3xl">
                {page.totalMessages.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--muted)]">Days together</dt>
              <dd className="font-[family-name:var(--font-cormorant)] text-3xl">
                {page.daysTogether}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--muted)]">Longest silence</dt>
              <dd className="font-[family-name:var(--font-cormorant)] text-3xl">
                {page.longestSilenceDays} days
              </dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--muted)]">Most active day</dt>
              <dd className="font-[family-name:var(--font-cormorant)] text-3xl">
                {page.mostActiveDay || "—"}
              </dd>
            </div>
            {page.keyword ? (
              <div className="sm:col-span-2">
                <dt className="text-sm text-[var(--muted)]">
                  Times you said “{page.keyword}”
                </dt>
                <dd className="font-[family-name:var(--font-cormorant)] text-3xl">
                  {page.keywordCount.toLocaleString()}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      )}

      {page.type === "timeline" && (
        <div className="flex flex-1 flex-col">
          <h2 className="text-center font-[family-name:var(--font-cormorant)] text-3xl">
            Timeline
          </h2>
          <div className="mx-auto mt-3 h-px w-24 bg-[var(--gold)]" />
          <ul className="mt-10 space-y-4">
            {page.events.map((e) => (
              <li key={`${e.at}-${e.label}`} className="flex gap-4">
                <span className="w-28 shrink-0 text-sm text-[var(--muted)]">{e.at}</span>
                <span className="font-[family-name:var(--font-eb-garamond)] text-lg">
                  {e.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <footer className="mt-auto pt-10 text-center text-xs text-[var(--muted)]">
        {index + 1}
      </footer>
    </article>
  );
}
