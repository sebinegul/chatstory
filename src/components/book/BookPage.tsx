"use client";

import type { BookPageModel } from "@/lib/ai/types";
import { normalizeTemplateId, type TemplateId } from "@/lib/templates/registry";
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
  variant?: "frame" | "bleed" | "polaroid" | "strip" | "meadow" | "heart";
}) {
  if (!url) return null;
  if (variant === "bleed") {
    return (
      <figure className="absolute inset-0 m-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
      </figure>
    );
  }
  if (variant === "heart") {
    return (
      <figure className="relative mx-auto my-6 w-[min(100%,17rem)]">
        <div className="absolute -inset-3 rounded-[2rem] bg-[#ffd6e0]/70 blur-[2px]" />
        <div className="relative overflow-hidden rounded-[1.75rem] border-[6px] border-white shadow-[0_14px_36px_rgba(232,120,140,0.25)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="aspect-square w-full object-cover" />
        </div>
        {caption ? (
          <figcaption className="mt-3 text-center font-[family-name:var(--font-eb-garamond)] text-sm italic text-[#c45d75]">
            ♡ {caption}
          </figcaption>
        ) : null}
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
      <div className="border border-[#b08d57]/50 bg-[#faf6ee] p-2.5 shadow-[inset_0_0_0_1px_rgba(176,141,87,0.2)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="aspect-[4/5] w-full object-cover" />
      </div>
      {caption ? (
        <figcaption className="mt-3 text-center text-xs uppercase tracking-[0.18em] text-[#8a6b3d]">
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
  templateId: TemplateId | string;
}) {
  const id = normalizeTemplateId(String(templateId)) || "elegant-gold";
  if (id === "minimal-ink") return <QuietTypePage page={page} index={index} />;
  if (id === "cute") return <HoneyHeartPage page={page} index={index} />;
  if (id === "ghibli") return <GhibliPage page={page} index={index} />;
  return <VelvetLetterPage page={page} index={index} />;
}

function PageFoot({
  index,
  className = "",
}: {
  index: number;
  className?: string;
}) {
  return (
    <footer className={`mt-auto pt-10 text-center text-xs opacity-50 ${className}`}>
      {index + 1}
    </footer>
  );
}

/** Elegant love-letter keepsake */
function VelvetLetterPage({
  page,
  index,
}: {
  page: BookPageModel;
  index: number;
}) {
  return (
    <article className="book-page book-gold relative mx-auto flex min-h-[70vh] w-full max-w-[42rem] flex-col px-8 py-10 sm:px-12">
      <div className="pointer-events-none absolute inset-3 border border-[#b08d57]/30" />
      <div className="pointer-events-none absolute inset-5 border border-[#b08d57]/15" />
      <CornerOrnament className="left-7 top-7" />
      <CornerOrnament className="right-7 top-7 rotate-90" />
      <CornerOrnament className="bottom-7 left-7 -rotate-90" />
      <CornerOrnament className="bottom-7 right-7 rotate-180" />

      {page.type === "cover" && (
        <div className="relative z-[1] flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#8a6b3d]">
            A private keepsake
          </p>
          {page.imageUrl ? (
            <PageImage url={page.imageUrl} variant="frame" />
          ) : (
            <div className="my-10 flex h-36 w-28 items-center justify-center border border-[#b08d57]/45 bg-[#faf6ee]">
              <span className="font-[family-name:var(--font-cormorant)] text-4xl text-[#b08d57]">
                ❦
              </span>
            </div>
          )}
          <h2 className="max-w-md font-[family-name:var(--font-cormorant)] text-4xl leading-[1.1] text-[#1c1917] sm:text-5xl">
            {page.title}
          </h2>
          <div className="mt-7 flex items-center gap-3 text-[#b08d57]">
            <span className="h-px w-12 bg-[#b08d57]" />
            <span className="text-sm">◆</span>
            <span className="h-px w-12 bg-[#b08d57]" />
          </div>
          <p className="mt-5 max-w-xs font-[family-name:var(--font-eb-garamond)] text-sm italic text-[#6b5e4e]">
            Their words, kept gently, as they were written.
          </p>
        </div>
      )}

      {page.type === "dedication" && (
        <div className="relative z-[1] flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#8a6b3d]">
            Dedication
          </p>
          <p className="mt-10 max-w-md font-[family-name:var(--font-eb-garamond)] text-2xl italic leading-relaxed text-[#2c241c]">
            {page.text}
          </p>
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="frame" />
        </div>
      )}

      {page.type === "chapter" && (
        <div className="relative z-[1] flex flex-1 flex-col">
          <p className="text-center text-[10px] uppercase tracking-[0.32em] text-[#8a6b3d]">
            A page from us
          </p>
          <h2 className="mt-3 text-center font-[family-name:var(--font-cormorant)] text-3xl text-[#1c1917]">
            {page.title}
          </h2>
          <div className="mx-auto mt-4 flex items-center gap-2 text-[#b08d57]">
            <span className="h-px w-10 bg-[#b08d57]" />
            <span>✦</span>
            <span className="h-px w-10 bg-[#b08d57]" />
          </div>
          <p className="mt-8 text-center font-[family-name:var(--font-eb-garamond)] text-lg leading-[1.75] text-[#3f3428]">
            {page.narration}
          </p>
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="frame" />
          <div className="mt-8 space-y-7">
            {page.quotes.map((q, i) => (
              <blockquote
                key={`${q.at}-${i}`}
                className="border-l-2 border-[#b08d57] bg-[#faf6ee]/80 py-2 pl-5 pr-2"
              >
                <p className="font-[family-name:var(--font-eb-garamond)] text-xl leading-relaxed text-[#1c1917]">
                  “{q.text}”
                </p>
                <footer className="mt-2 text-sm text-[#8a6b3d]">
                  {q.author} · {formatWhen(q.at)}
                </footer>
              </blockquote>
            ))}
          </div>
          {page.milestone && (
            <p className="mt-8 text-center text-xs uppercase tracking-[0.18em] text-[#8a6b3d]">
              {page.milestone}
            </p>
          )}
        </div>
      )}

      {page.type === "numbers" && (
        <div className="relative z-[1] flex flex-1 flex-col justify-center">
          <h2 className="text-center font-[family-name:var(--font-cormorant)] text-3xl">
            What the days kept
          </h2>
          <div className="mx-auto mt-3 h-px w-24 bg-[#b08d57]" />
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="frame" />
          <ElegantNumbers page={page} />
        </div>
      )}

      {page.type === "timeline" && (
        <div className="relative z-[1] flex flex-1 flex-col">
          <h2 className="text-center font-[family-name:var(--font-cormorant)] text-3xl">
            Along the way
          </h2>
          <div className="mx-auto mt-3 h-px w-24 bg-[#b08d57]" />
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="frame" />
          <ul className="mt-10 space-y-5">
            {page.events.map((e) => (
              <li key={`${e.at}-${e.label}`} className="flex items-start gap-4">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#b08d57]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#8a6b3d]">
                    {formatDay(e.at)}
                  </p>
                  <p className="font-[family-name:var(--font-eb-garamond)] text-lg">
                    {e.label}
                  </p>
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

function CornerOrnament({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute h-5 w-5 border-l border-t border-[#b08d57]/50 ${className || ""}`}
    />
  );
}

function ElegantNumbers({
  page,
}: {
  page: Extract<BookPageModel, { type: "numbers" }>;
}) {
  const items = [
    { label: "Messages shared", value: page.totalMessages.toLocaleString("en-IN") },
    { label: "Days held together", value: String(page.daysTogether) },
    { label: "Longest quiet", value: `${page.longestSilenceDays} days` },
    { label: "Most alive day", value: formatDay(page.mostActiveDay || "") || "—" },
  ];
  if (page.keyword) {
    items.push({
      label: `Times you said “${page.keyword}”`,
      value: page.keywordCount.toLocaleString("en-IN"),
    });
  }
  return (
    <dl className="mt-10 grid gap-8 sm:grid-cols-2">
      {items.map((it) => (
        <div key={it.label} className="text-center">
          <dt className="text-sm text-[#8a6b3d]">{it.label}</dt>
          <dd className="mt-1 font-[family-name:var(--font-cormorant)] text-3xl text-[#1c1917]">
            {it.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Editorial poetry — tender, restrained */
function QuietTypePage({
  page,
  index,
}: {
  page: BookPageModel;
  index: number;
}) {
  if (page.type === "cover") {
    return (
      <article className="book-page book-minimal relative mx-auto flex min-h-[70vh] w-full max-w-[42rem] flex-col overflow-hidden bg-[#0c0c0c] text-white">
        {page.imageUrl ? (
          <PageImage url={page.imageUrl} variant="bleed" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#333,transparent_55%),linear-gradient(#161616,#050505)]" />
        )}
        <div className="relative z-[1] flex flex-1 flex-col justify-end p-10 sm:p-14">
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/50">Still yours</p>
          <h2 className="mt-4 max-w-md font-[family-name:var(--font-cormorant)] text-5xl leading-[0.95] sm:text-6xl">
            {page.title}
          </h2>
          <p className="mt-5 max-w-sm font-[family-name:var(--font-eb-garamond)] text-base italic text-white/70">
            A book of messages that refused to stay ordinary.
          </p>
          <div className="mt-8 h-px w-16 bg-white/45" />
        </div>
        <PageFoot index={index} className="relative z-[1] text-white/35" />
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
              <p className="text-[10px] uppercase tracking-[0.35em] text-black/40">
                Hold this page
              </p>
              <h2 className="mt-2 max-w-md font-[family-name:var(--font-cormorant)] text-4xl leading-[1.05]">
                {page.title}
              </h2>
            </div>
            <span className="font-[family-name:var(--font-dm)] text-xs text-black/35">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <p className="mt-8 max-w-prose font-[family-name:var(--font-dm)] text-sm leading-relaxed text-black/70">
            {page.narration}
          </p>
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="strip" />
          <div className="mt-10 space-y-12">
            {page.quotes.map((q, i) => (
              <div key={`${q.at}-${i}`}>
                <p className="max-w-lg font-[family-name:var(--font-cormorant)] text-[2rem] leading-snug sm:text-[2.35rem]">
                  {q.text}
                </p>
                <p className="mt-3 font-[family-name:var(--font-dm)] text-[10px] uppercase tracking-[0.22em] text-black/45">
                  {q.author} · {formatWhen(q.at)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {page.type === "numbers" && (
        <div className="flex flex-1 flex-col justify-center">
          <p className="text-[10px] uppercase tracking-[0.35em] text-black/40">The quiet math</p>
          <h2 className="mt-2 font-[family-name:var(--font-cormorant)] text-5xl">Numbers</h2>
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="strip" />
          <InkNumbers page={page} />
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
                <span className="font-[family-name:var(--font-dm)] text-xs text-black/45">
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

function InkNumbers({
  page,
}: {
  page: Extract<BookPageModel, { type: "numbers" }>;
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

/** Cute peach / heart scrapbook */
function HoneyHeartPage({
  page,
  index,
}: {
  page: BookPageModel;
  index: number;
}) {
  return (
    <article className="book-page book-cute relative mx-auto flex min-h-[70vh] w-full max-w-[42rem] flex-col overflow-hidden px-6 py-8 sm:px-10">
      <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#ffd6e0]/80" />
      <div className="pointer-events-none absolute -bottom-12 -left-10 h-44 w-44 rounded-full bg-[#ffe8c8]/90" />
      <div className="pointer-events-none absolute right-10 top-28 text-2xl text-[#ff9eb5]/50">
        ♡
      </div>
      <div className="pointer-events-none absolute bottom-24 left-8 text-xl text-[#ffb86c]/45">
        ✿
      </div>

      {page.type === "cover" && (
        <div className="relative z-[1] flex flex-1 flex-col items-center justify-center text-center">
          {page.imageUrl ? (
            <PageImage url={page.imageUrl} variant="heart" />
          ) : (
            <div className="mb-4 flex h-36 w-36 items-center justify-center rounded-full bg-[#ffd6e0] shadow-inner">
              <span className="text-5xl text-[#e8788c]">♡</span>
            </div>
          )}
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[#e8788c]">
            Our little book
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#5a3040]">
            {page.title}
          </h2>
          <p className="mt-3 text-sm text-[#c45d75]">made of texts & soft nights</p>
        </div>
      )}

      {page.type === "dedication" && (
        <div className="relative z-[1] flex flex-1 flex-col items-center justify-center">
          <div className="max-w-md rounded-[2rem] bg-white/85 px-6 py-8 text-center shadow-[0_10px_30px_rgba(232,120,140,0.12)]">
            <p className="text-xs uppercase tracking-[0.2em] text-[#e8788c]">A tiny note</p>
            <p className="mt-4 font-[family-name:var(--font-eb-garamond)] text-xl italic text-[#5a3040]">
              {page.text}
            </p>
          </div>
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="heart" />
        </div>
      )}

      {page.type === "chapter" && (
        <div className="relative z-[1] flex flex-1 flex-col">
          <div className="rounded-[2rem] bg-[#ffd6e0]/70 px-5 py-5 text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#e8788c]">
              little chapter
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-cormorant)] text-2xl text-[#5a3040]">
              {page.title}
            </h2>
          </div>
          <p className="mt-6 px-1 font-[family-name:var(--font-eb-garamond)] text-lg leading-relaxed text-[#7a4555]">
            {page.narration}
          </p>
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="heart" />
          <div className="mt-4 space-y-4">
            {page.quotes.map((q, i) => (
              <div
                key={`${q.at}-${i}`}
                className={`rounded-[1.5rem] bg-white/90 px-4 py-4 shadow-[0_8px_22px_rgba(232,120,140,0.1)] ${
                  i % 2 === 0 ? "rotate-[-0.8deg]" : "rotate-[0.8deg]"
                }`}
              >
                <p className="text-[#e8788c]">♡</p>
                <p className="mt-1 font-[family-name:var(--font-eb-garamond)] text-lg text-[#5a3040]">
                  “{q.text}”
                </p>
                <p className="mt-2 text-xs text-[#c45d75]">
                  {q.author} · {formatWhen(q.at)}
                </p>
              </div>
            ))}
          </div>
          {page.milestone && (
            <p className="mt-6 text-center text-xs uppercase tracking-[0.16em] text-[#e8788c]">
              {page.milestone}
            </p>
          )}
        </div>
      )}

      {page.type === "numbers" && (
        <div className="relative z-[1] flex flex-1 flex-col justify-center">
          <div className="rounded-[2rem] bg-[#ffd6e0]/70 px-5 py-4 text-center">
            <h2 className="font-[family-name:var(--font-cormorant)] text-2xl text-[#5a3040]">
              Cute little counts
            </h2>
          </div>
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="heart" />
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              { label: "Messages", value: page.totalMessages.toLocaleString("en-IN") },
              { label: "Days together", value: String(page.daysTogether) },
              { label: "Longest silence", value: `${page.longestSilenceDays} days` },
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
                className="rounded-[1.5rem] bg-white/90 px-4 py-5 text-center shadow-sm"
              >
                <dt className="text-xs text-[#c45d75]">{it.label}</dt>
                <dd className="mt-2 font-[family-name:var(--font-cormorant)] text-3xl text-[#5a3040]">
                  {it.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {page.type === "timeline" && (
        <div className="relative z-[1] flex flex-1 flex-col">
          <div className="rounded-[2rem] bg-[#ffd6e0]/70 px-5 py-4 text-center">
            <h2 className="font-[family-name:var(--font-cormorant)] text-2xl text-[#5a3040]">
              Our sweet timeline
            </h2>
          </div>
          <PageImage url={page.imageUrl} caption={page.imageCaption} variant="heart" />
          <ul className="mt-6 space-y-3">
            {page.events.map((e) => (
              <li
                key={`${e.at}-${e.label}`}
                className="flex gap-3 rounded-[1.25rem] bg-white/90 px-4 py-3 shadow-sm"
              >
                <span className="text-[#e8788c]">♡</span>
                <span className="w-24 shrink-0 text-xs text-[#c45d75]">{formatDay(e.at)}</span>
                <span className="font-[family-name:var(--font-eb-garamond)] text-lg text-[#5a3040]">
                  {e.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <PageFoot index={index} className="relative z-[1] text-[#c45d75]" />
    </article>
  );
}

/** Soft meadow / sky — Ghibli-inspired */
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
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#cfeaf6_0%,#e8f6ef_38%,#f6f0df_72%,#d9e8c4_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-6 top-8 h-20 w-36 rounded-[100%] bg-white/75"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-6 top-20 h-14 w-24 rounded-[100%] bg-white/60"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/3 top-14 h-10 w-20 rounded-[100%] bg-white/50"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-[linear-gradient(180deg,transparent,#b7d59a)]"
        aria-hidden
      />

      {page.type === "cover" && (
        <div className="relative z-[1] flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#5a8a9a]">
            Under soft skies
          </p>
          {page.imageUrl ? (
            <PageImage url={page.imageUrl} variant="meadow" />
          ) : (
            <div className="my-8 flex h-44 w-44 items-center justify-center rounded-full bg-white/55 shadow-inner">
              <span className="font-[family-name:var(--font-cormorant)] text-5xl text-[#7aab8c]">
                ✿
              </span>
            </div>
          )}
          <h2 className="mt-2 max-w-md font-[family-name:var(--font-cormorant)] text-4xl leading-tight text-[#2f4a3e] sm:text-5xl">
            {page.title}
          </h2>
          <p className="mt-4 max-w-sm font-[family-name:var(--font-eb-garamond)] text-base italic text-[#4a6b5c]">
            Like a path through grass after rain — quiet, green, still glowing.
          </p>
        </div>
      )}

      {page.type === "dedication" && (
        <div className="relative z-[1] flex flex-1 flex-col items-center justify-center text-center">
          <div className="max-w-md rounded-[2rem] bg-white/70 px-7 py-9 shadow-[0_12px_40px_rgba(90,138,154,0.12)]">
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
          <div className="rounded-[2rem] bg-white/60 px-5 py-5 text-center shadow-sm">
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
                className="rounded-[1.5rem] border border-[#b8d4c4]/90 bg-white/75 px-5 py-4"
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
              { label: "Messages", value: page.totalMessages.toLocaleString("en-IN") },
              { label: "Days together", value: String(page.daysTogether) },
              { label: "Longest silence", value: `${page.longestSilenceDays} days` },
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
                className="rounded-[1.5rem] bg-white/75 px-4 py-5 text-center shadow-sm"
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
                className="flex gap-3 rounded-[1.25rem] bg-white/75 px-4 py-3 shadow-sm"
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
