"use client";

import type { BookPageModel } from "@/lib/ai/types";
import type { TemplateId } from "@/lib/templates/registry";
import { formatDateTimeDMY, formatDayKeyDMY } from "@/lib/format-date";

function formatWhen(iso: string) {
  return formatDateTimeDMY(iso);
}

function formatDay(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return formatDayKeyDMY(value);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  return formatDateTimeDMY(value).split(",")[0] || value;
}

function PageImage({
  url,
  caption,
  variant = "frame",
}: {
  url?: string;
  caption?: string;
  variant?: "frame" | "bleed" | "polaroid" | "strip" | "meadow";
}) {
  if (!url) return null;
  if (variant === "bleed") {
    return (
      <figure className="absolute inset-0 m-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </figure>
    );
  }
  if (variant === "polaroid") {
    return (
      <figure className="mx-auto my-6 w-[min(100%,18rem)] rotate-[-2deg] bg-white p-3 pb-8 shadow-[0_12px_30px_rgba(74,48,48,0.12)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="aspect-[4/5] w-full object-cover" />
        {caption ? (
          <figcaption className="mt-3 text-center font-[family-name:var(--font-eb-garamond)] text-sm italic text-[#6b4a4a]">
            {caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }
  if (variant === "strip") {
    return (
      <figure className="my-8 overflow-hidden border border-black/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="aspect-[21/9] w-full object-cover" />
        {caption ? (
          <figcaption className="border-t border-black/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-black/45">
            {caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }
  if (variant === "meadow") {
    return (
      <figure className="relative mx-auto my-7 w-[min(100%,20rem)]">
        <div className="absolute -inset-2 rounded-[2rem] bg-gradient-to-br from-[#a8d8ea]/50 to-[#b8e0c8]/40 blur-[1px]" />
        <div className="relative overflow-hidden rounded-[1.75rem] border-4 border-white shadow-[0_16px_40px_rgba(74,120,140,0.18)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="aspect-[4/5] w-full object-cover" />
        </div>
        {caption ? (
          <figcaption className="mt-3 text-center font-[family-name:var(--font-eb-garamond)] text-sm italic text-[#4a6b5c]">
            {caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }
  return (
    <figure className="mx-auto my-8 max-w-sm">
      <div className="border border-[var(--gold)]/40 p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="aspect-[4/5] w-full object-cover" />
      </div>
      {caption ? (
        <figcaption className="mt-3 text-center text-xs uppercase tracking-[0.18em] text-[var(--gold-deep)]">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
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
  if (templateId === "minimal-ink") {
    return <MinimalInkPage page={page} index={index} />;
  }
  if (templateId === "pastel") {
    return <PastelPage page={page} index={index} />;
  }
  if (templateId === "ghibli") {
    return <GhibliPage page={page} index={index} />;
  }
  return <ElegantGoldPage page={page} index={index} />;
}

function PageFoot({ index, className = "" }: { index: number; className?: string }) {
  return (
    <footer className={`mt-auto pt-10 text-center text-xs opacity-50 ${className}`}>
      {index + 1}
    </footer>
  );
}

function NumbersGrid({
  page,
  tone = "gold",
}: {
  page: Extract<BookPageModel, { type: "numbers" }>;
  tone?: "gold" | "ink" | "pastel";
}) {
  const items = [
    { label: "Messages", value: page.totalMessages.toLocaleString("en-IN") },
    { label: "Days together", value: String(page.daysTogether) },
    { label: "Longest silence", value: `${page.longestSilenceDays} days` },
    { label: "Most active day", value: formatDay(page.mostActiveDay || "") || "—" },
  ];
  if (page.keyword) {
    items.push({
      label: `Times you said “${page.keyword}”`,
      value: page.keywordCount.toLocaleString("en-IN"),
    });
  }

  if (tone === "ink") {
    return (
      <dl className="mt-12 divide-y divide-black/10 border-y border-black/10">
        {items.map((it) => (
          <div key={it.label} className="flex items-baseline justify-between gap-6 py-5">
            <dt className="text-[10px] uppercase tracking-[0.22em] text-black/45">{it.label}</dt>
            <dd className="font-[family-name:var(--font-cormorant)] text-3xl">{it.value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  if (tone === "pastel") {
    return (
      <dl className="mt-8 grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <div
            key={it.label}
            className="rounded-[1.25rem] bg-white/75 px-4 py-5 text-center shadow-sm"
          >
            <dt className="text-xs text-[#9a6b6b]">{it.label}</dt>
            <dd className="mt-2 font-[family-name:var(--font-cormorant)] text-3xl text-[#4a3030]">
              {it.value}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl className="mt-10 grid gap-8 sm:grid-cols-2">
      {items.map((it) => (
        <div key={it.label} className="text-center">
          <dt className="text-sm opacity-60">{it.label}</dt>
          <dd className="mt-1 font-[family-name:var(--font-cormorant)] text-3xl">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Ornate classic keepsake: centered, gold rules, framed photo */
function ElegantGoldPage({
  page,
  index,
}: {
  page: BookPageModel;
  index: number;
}) {
  return (
    <article className="book-page book-gold relative mx-auto flex min-h-[70vh] w-full max-w-[42rem] flex-col px-8 py-10 sm:px-12">
      <div className="pointer-events-none absolute inset-4 border border-[var(--gold)]/25" />
      <div className="pointer-events-none absolute inset-6 border border-[var(--gold)]/15" />

      {page.type === "cover" && (
        <div className="relative z-[1] flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-2 flex items-center gap-3 text-[var(--gold-deep)]">
            <span className="h-px w-8 bg-[var(--gold)]" />
            <span className="text-[10px] uppercase tracking-[0.35em]">ChatStory</span>
            <span className="h-px w-8 bg-[var(--gold)]" />
          </div>
          {page.imageUrl ? (
            <PageImage url={page.imageUrl} variant="frame" />
          ) : (
            <div className="my-8 flex h-40 w-28 items-center justify-center border border-[var(--gold)]/40">
              <span className="font-[family-name:var(--font-cormorant)] text-4xl text-[var(--gold)]">
                ❦
              </span>
            </div>
          )}
          <h2 className="mt-2 font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl">
            {page.title}
          </h2>
          <div className="mx-auto mt-6 flex items-center gap-2">
            <span className="h-px w-10 bg-[var(--gold)]" />
            <span className="text-[var(--gold)]">◆</span>
            <span className="h-px w-10 bg-[var(--gold)]" />
          </div>
        </div>
      )}

      {page.type === "dedication" && (
        <div className="relative z-[1] flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--gold-deep)]">
            Dedication
          </p>
          <p className="mt-8 max-w-md font-[family-name:var(--font-eb-garamond)] text-2xl italic leading-relaxed opacity-90">
            {page.text}
          </p>
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="frame" />
        </div>
      )}

      {page.type === "chapter" && (
        <div className="relative z-[1] flex flex-1 flex-col">
          <p className="text-center text-[10px] uppercase tracking-[0.28em] text-[var(--gold-deep)]">
            Chapter
          </p>
          <h2 className="mt-3 text-center font-[family-name:var(--font-cormorant)] text-3xl">
            {page.title}
          </h2>
          <div className="mx-auto mt-4 flex items-center gap-2">
            <span className="h-px w-12 bg-[var(--gold)]" />
            <span className="text-xs text-[var(--gold)]">✦</span>
            <span className="h-px w-12 bg-[var(--gold)]" />
          </div>
          <p className="mt-8 text-center font-[family-name:var(--font-eb-garamond)] text-lg leading-relaxed opacity-85">
            {page.narration}
          </p>
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="frame" />
          <div className="mt-8 space-y-6">
            {page.quotes.map((q, i) => (
              <blockquote
                key={`${q.at}-${i}`}
                className="border-l-2 border-[var(--gold)] pl-4 text-left"
              >
                <p className="font-[family-name:var(--font-eb-garamond)] text-xl leading-relaxed">
                  “{q.text}”
                </p>
                <footer className="mt-2 text-sm opacity-60">
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
        <div className="relative z-[1] flex flex-1 flex-col justify-center">
          <h2 className="text-center font-[family-name:var(--font-cormorant)] text-3xl">
            The Numbers
          </h2>
          <div className="mx-auto mt-3 h-px w-24 bg-[var(--gold)]" />
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="frame" />
          <NumbersGrid page={page} tone="gold" />
        </div>
      )}

      {page.type === "timeline" && (
        <div className="relative z-[1] flex flex-1 flex-col">
          <h2 className="text-center font-[family-name:var(--font-cormorant)] text-3xl">
            Timeline
          </h2>
          <div className="mx-auto mt-3 h-px w-24 bg-[var(--gold)]" />
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="frame" />
          <ul className="mt-10 space-y-5">
            {page.events.map((e) => (
              <li key={`${e.at}-${e.label}`} className="flex items-start gap-4">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--gold)]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--gold-deep)]">
                    {formatDay(e.at)}
                  </p>
                  <p className="font-[family-name:var(--font-eb-garamond)] text-lg">{e.label}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <PageFoot index={index} className="relative z-[1]" />
    </article>
  );
}

/** Stark editorial magazine: full-bleed cover, huge pull quotes, rule lines */
function MinimalInkPage({
  page,
  index,
}: {
  page: BookPageModel;
  index: number;
}) {
  if (page.type === "cover") {
    return (
      <article className="book-page book-minimal relative mx-auto flex min-h-[70vh] w-full max-w-[42rem] flex-col overflow-hidden bg-black text-white">
        {page.imageUrl ? (
          <PageImage url={page.imageUrl} variant="bleed" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#333,transparent_55%),linear-gradient(#111,#000)]" />
        )}
        <div className="relative z-[1] flex flex-1 flex-col justify-end p-10 sm:p-14">
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/55">ChatStory</p>
          <h2 className="mt-4 max-w-md font-[family-name:var(--font-cormorant)] text-5xl leading-[0.95] tracking-tight sm:text-6xl">
            {page.title}
          </h2>
          <div className="mt-8 h-px w-16 bg-white/50" />
        </div>
        <PageFoot index={index} className="relative z-[1] text-white/40" />
      </article>
    );
  }

  return (
    <article className="book-page book-minimal relative mx-auto flex min-h-[70vh] w-full max-w-[42rem] flex-col px-10 py-12 sm:px-14">
      {page.type === "dedication" && (
        <div className="flex flex-1 flex-col justify-center border-l-4 border-black pl-8">
          <p className="text-[10px] uppercase tracking-[0.35em] text-black/40">For you</p>
          <p className="mt-6 max-w-md font-[family-name:var(--font-cormorant)] text-3xl leading-snug">
            {page.text}
          </p>
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="strip" />
        </div>
      )}

      {page.type === "chapter" && (
        <div className="flex flex-1 flex-col">
          <div className="flex items-end justify-between gap-4 border-b-2 border-black pb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-black/40">Chapter</p>
              <h2 className="mt-2 max-w-md font-[family-name:var(--font-cormorant)] text-4xl leading-[1.05]">
                {page.title}
              </h2>
            </div>
            <span className="font-[family-name:var(--font-jost)] text-xs text-black/35">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <p className="mt-8 max-w-prose font-[family-name:var(--font-jost)] text-sm leading-relaxed text-black/70">
            {page.narration}
          </p>
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="strip" />
          <div className="mt-10 space-y-12">
            {page.quotes.map((q, i) => (
              <div key={`${q.at}-${i}`}>
                <p className="max-w-lg font-[family-name:var(--font-cormorant)] text-[2rem] leading-snug sm:text-[2.35rem]">
                  {q.text}
                </p>
                <p className="mt-3 font-[family-name:var(--font-jost)] text-[10px] uppercase tracking-[0.22em] text-black/45">
                  {q.author} · {formatWhen(q.at)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {page.type === "numbers" && (
        <div className="flex flex-1 flex-col justify-center">
          <p className="text-[10px] uppercase tracking-[0.35em] text-black/40">Index</p>
          <h2 className="mt-2 font-[family-name:var(--font-cormorant)] text-5xl">Numbers</h2>
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="strip" />
          <NumbersGrid page={page} tone="ink" />
        </div>
      )}

      {page.type === "timeline" && (
        <div className="flex flex-1 flex-col">
          <p className="text-[10px] uppercase tracking-[0.35em] text-black/40">Chronology</p>
          <h2 className="mt-2 font-[family-name:var(--font-cormorant)] text-5xl">Timeline</h2>
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="strip" />
          <ul className="mt-10">
            {page.events.map((e, i) => (
              <li
                key={`${e.at}-${e.label}`}
                className="grid grid-cols-[5rem_1fr] gap-4 border-t border-black/10 py-4"
              >
                <span className="font-[family-name:var(--font-jost)] text-xs text-black/45">
                  {formatDay(e.at)}
                </span>
                <span className="font-[family-name:var(--font-cormorant)] text-xl">
                  <span className="mr-3 text-black/30">{String(i + 1).padStart(2, "0")}</span>
                  {e.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <PageFoot index={index} />
    </article>
  );
}

/** Soft scrapbook: polaroids, blush bands, rounded keepsake cards */
function PastelPage({
  page,
  index,
}: {
  page: BookPageModel;
  index: number;
}) {
  return (
    <article className="book-page book-pastel relative mx-auto flex min-h-[70vh] w-full max-w-[42rem] flex-col overflow-hidden px-6 py-8 sm:px-10">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#f3e4e2]" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-[#efe0dc]/80" />

      {page.type === "cover" && (
        <div className="relative z-[1] flex flex-1 flex-col items-center justify-center text-center">
          {page.imageUrl ? (
            <PageImage url={page.imageUrl} variant="polaroid" />
          ) : (
            <div className="mb-4 rotate-[-3deg] rounded-[1.5rem] bg-[#f3e4e2] px-10 py-12">
              <span className="font-[family-name:var(--font-cormorant)] text-5xl text-[#c48b8b]">
                ♡
              </span>
            </div>
          )}
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[#9a6b6b]">ChatStory</p>
          <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#4a3030]">
            {page.title}
          </h2>
        </div>
      )}

      {page.type === "dedication" && (
        <div className="relative z-[1] flex flex-1 flex-col items-center justify-center">
          <div className="max-w-md rounded-[1.5rem] bg-white/80 px-6 py-8 text-center shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-[#9a6b6b]">A note</p>
            <p className="mt-4 font-[family-name:var(--font-eb-garamond)] text-xl italic text-[#4a3030]">
              {page.text}
            </p>
          </div>
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="polaroid" />
        </div>
      )}

      {page.type === "chapter" && (
        <div className="relative z-[1] flex flex-1 flex-col">
          <div className="rounded-[1.5rem] bg-[#f3e4e2] px-5 py-5 text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#9a6b6b]">This chapter</p>
            <h2 className="mt-1 font-[family-name:var(--font-cormorant)] text-2xl text-[#4a3030]">
              {page.title}
            </h2>
          </div>
          <p className="mt-6 px-1 font-[family-name:var(--font-eb-garamond)] text-lg leading-relaxed text-[#6b4a4a]">
            {page.narration}
          </p>
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="polaroid" />
          <div className="mt-4 space-y-4">
            {page.quotes.map((q, i) => (
              <div
                key={`${q.at}-${i}`}
                className={`rounded-[1.25rem] bg-white/85 px-4 py-4 shadow-sm ${
                  i % 2 === 0 ? "rotate-[-0.5deg]" : "rotate-[0.6deg]"
                }`}
              >
                <p className="font-[family-name:var(--font-eb-garamond)] text-lg text-[#4a3030]">
                  “{q.text}”
                </p>
                <p className="mt-2 text-xs text-[#9a6b6b]">
                  {q.author} · {formatWhen(q.at)}
                </p>
              </div>
            ))}
          </div>
          {page.milestone && (
            <p className="mt-6 text-center text-xs uppercase tracking-[0.16em] text-[#9a6b6b]">
              {page.milestone}
            </p>
          )}
        </div>
      )}

      {page.type === "numbers" && (
        <div className="relative z-[1] flex flex-1 flex-col justify-center">
          <div className="rounded-[1.5rem] bg-[#f3e4e2] px-5 py-4 text-center">
            <h2 className="font-[family-name:var(--font-cormorant)] text-2xl text-[#4a3030]">
              Little numbers
            </h2>
          </div>
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="polaroid" />
          <NumbersGrid page={page} tone="pastel" />
        </div>
      )}

      {page.type === "timeline" && (
        <div className="relative z-[1] flex flex-1 flex-col">
          <div className="rounded-[1.5rem] bg-[#f3e4e2] px-5 py-4 text-center">
            <h2 className="font-[family-name:var(--font-cormorant)] text-2xl text-[#4a3030]">
              Our timeline
            </h2>
          </div>
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="polaroid" />
          <ul className="mt-6 space-y-3">
            {page.events.map((e) => (
              <li
                key={`${e.at}-${e.label}`}
                className="flex gap-3 rounded-[1rem] bg-white/80 px-4 py-3 shadow-sm"
              >
                <span className="w-24 shrink-0 text-xs text-[#9a6b6b]">{formatDay(e.at)}</span>
                <span className="font-[family-name:var(--font-eb-garamond)] text-lg text-[#4a3030]">
                  {e.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <PageFoot index={index} className="relative z-[1]" />
    </article>
  );
}

/** Soft meadow / sky storybook — Ghibli-inspired layout */
function GhibliPage({
  page,
  index,
}: {
  page: BookPageModel;
  index: number;
}) {
  return (
    <article className="book-page book-ghibli relative mx-auto flex min-h-[70vh] w-full max-w-[42rem] flex-col overflow-hidden px-7 py-9 sm:px-11">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#d4eef8_0%,#eef8f2_42%,#f7f3e8_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-8 top-10 h-24 w-40 rounded-[100%] bg-white/70 blur-[1px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-4 top-24 h-16 w-28 rounded-[100%] bg-white/55"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-28 bg-[linear-gradient(180deg,transparent,#c5e0b8)]"
        aria-hidden
      />

      {page.type === "cover" && (
        <div className="relative z-[1] flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#5a8a9a]">
            ChatStory · Meadow
          </p>
          {page.imageUrl ? (
            <PageImage url={page.imageUrl} variant="meadow" />
          ) : (
            <div className="my-8 flex h-44 w-44 items-center justify-center rounded-full bg-white/50 shadow-inner">
              <span className="font-[family-name:var(--font-cormorant)] text-5xl text-[#7aab8c]">
                ✿
              </span>
            </div>
          )}
          <h2 className="mt-2 max-w-md font-[family-name:var(--font-cormorant)] text-4xl leading-tight text-[#2f4a3e] sm:text-5xl">
            {page.title}
          </h2>
          <p className="mt-4 text-sm text-[#5a8a7a]">A story under soft skies</p>
        </div>
      )}

      {page.type === "dedication" && (
        <div className="relative z-[1] flex flex-1 flex-col items-center justify-center text-center">
          <div className="max-w-md rounded-[2rem] bg-white/65 px-7 py-9 shadow-[0_12px_40px_rgba(90,138,154,0.12)] backdrop-blur-[2px]">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#5a8a9a]">
              For the road
            </p>
            <p className="mt-5 font-[family-name:var(--font-eb-garamond)] text-2xl italic leading-relaxed text-[#2f4a3e]">
              {page.text}
            </p>
          </div>
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="meadow" />
        </div>
      )}

      {page.type === "chapter" && (
        <div className="relative z-[1] flex flex-1 flex-col">
          <div className="rounded-[2rem] bg-white/55 px-5 py-5 text-center shadow-sm backdrop-blur-[1px]">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#5a8a9a]">
              A quiet chapter
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-cormorant)] text-3xl text-[#2f4a3e]">
              {page.title}
            </h2>
          </div>
          <p className="mt-7 font-[family-name:var(--font-eb-garamond)] text-lg leading-relaxed text-[#3d5c4e]">
            {page.narration}
          </p>
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="meadow" />
          <div className="mt-4 space-y-4">
            {page.quotes.map((q, i) => (
              <blockquote
                key={`${q.at}-${i}`}
                className="rounded-[1.5rem] border border-[#b8d4c4]/80 bg-white/70 px-5 py-4"
              >
                <p className="font-[family-name:var(--font-eb-garamond)] text-xl leading-relaxed text-[#2f4a3e]">
                  “{q.text}”
                </p>
                <footer className="mt-2 text-xs text-[#5a8a7a]">
                  {q.author} · {formatWhen(q.at)}
                </footer>
              </blockquote>
            ))}
          </div>
          {page.milestone && (
            <p className="mt-6 text-center text-xs uppercase tracking-[0.16em] text-[#5a8a9a]">
              {page.milestone}
            </p>
          )}
        </div>
      )}

      {page.type === "numbers" && (
        <div className="relative z-[1] flex flex-1 flex-col justify-center">
          <h2 className="text-center font-[family-name:var(--font-cormorant)] text-3xl text-[#2f4a3e]">
            Little counts
          </h2>
          <p className="mt-2 text-center text-sm text-[#5a8a7a]">
            The soft math of your days
          </p>
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="meadow" />
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              {
                label: "Messages",
                value: page.totalMessages.toLocaleString("en-IN"),
              },
              { label: "Days together", value: String(page.daysTogether) },
              {
                label: "Longest silence",
                value: `${page.longestSilenceDays} days`,
              },
              {
                label: "Most active day",
                value: formatDay(page.mostActiveDay || "") || "—",
              },
              ...(page.keyword
                ? [
                    {
                      label: `Times you said “${page.keyword}”`,
                      value: page.keywordCount.toLocaleString("en-IN"),
                    },
                  ]
                : []),
            ].map((it) => (
              <div
                key={it.label}
                className="rounded-[1.5rem] bg-white/70 px-4 py-5 text-center shadow-sm"
              >
                <dt className="text-xs text-[#5a8a9a]">{it.label}</dt>
                <dd className="mt-2 font-[family-name:var(--font-cormorant)] text-3xl text-[#2f4a3e]">
                  {it.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {page.type === "timeline" && (
        <div className="relative z-[1] flex flex-1 flex-col">
          <h2 className="text-center font-[family-name:var(--font-cormorant)] text-3xl text-[#2f4a3e]">
            Path through the days
          </h2>
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="meadow" />
          <ul className="mt-6 space-y-3">
            {page.events.map((e) => (
              <li
                key={`${e.at}-${e.label}`}
                className="flex gap-3 rounded-[1.25rem] bg-white/70 px-4 py-3 shadow-sm"
              >
                <span className="w-24 shrink-0 text-xs text-[#5a8a9a]">
                  {formatDay(e.at)}
                </span>
                <span className="font-[family-name:var(--font-eb-garamond)] text-lg text-[#2f4a3e]">
                  {e.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <PageFoot index={index} className="relative z-[1] text-[#5a8a7a]" />
    </article>
  );
}
