import Link from "next/link";
import { ChatStoryMark } from "@/components/brand/ChatStoryMark";
import { TemplateMiniPreview } from "@/components/configure/TemplatePicker";
import { TEMPLATES } from "@/lib/templates/registry";

function SamplePage({
  kicker,
  title,
  body,
  quote,
  attribution,
  tone = "gold",
}: {
  kicker: string;
  title: string;
  body: string;
  quote?: string;
  attribution?: string;
  tone?: "gold" | "ink" | "pastel" | "ghibli";
}) {
  const bg =
    tone === "ink"
      ? "bg-[#fafafa]"
      : tone === "pastel"
        ? "bg-[#faf3f1]"
        : tone === "ghibli"
          ? "bg-gradient-to-b from-[#d4eef8] via-[#eef8f2] to-[#f7f3e8]"
          : "bg-[#fff8eb]";
  return (
    <div
      className={`sample-page relative aspect-[210/297] w-full overflow-hidden rounded-sm ${bg} px-6 py-7 shadow-[var(--shadow)] ring-1 ring-[rgba(28,25,23,0.08)]`}
    >
      {tone === "ghibli" ? (
        <>
          <div className="absolute left-4 top-8 h-8 w-16 rounded-full bg-white/70" />
          <div className="absolute right-6 top-16 h-5 w-10 rounded-full bg-white/50" />
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#c5e0b8] to-transparent" />
        </>
      ) : null}
      <p
        className={`relative text-[10px] uppercase tracking-[0.22em] ${
          tone === "ghibli" ? "text-[#5a8a9a]" : "text-[var(--gold-deep)]"
        }`}
      >
        {kicker}
      </p>
      <h3
        className={`relative mt-4 font-[family-name:var(--font-cormorant)] text-2xl leading-tight ${
          tone === "ghibli" ? "text-[#2f4a3e]" : "text-[var(--ink)]"
        }`}
      >
        {title}
      </h3>
      <div
        className={`relative mx-auto mt-3 h-px w-14 ${
          tone === "ghibli" ? "bg-[#7aab8c]" : "bg-[var(--gold)]"
        }`}
      />
      <p
        className={`relative mt-5 font-[family-name:var(--font-eb-garamond)] text-sm leading-relaxed ${
          tone === "ghibli" ? "text-[#3d5c4e]" : "text-[var(--ink-soft)]"
        }`}
      >
        {body}
      </p>
      {quote ? (
        <blockquote
          className={`relative mt-5 border-l pl-3 ${
            tone === "ghibli" ? "border-[#7aab8c]" : "border-[var(--gold)]"
          }`}
        >
          <p className="font-[family-name:var(--font-eb-garamond)] text-base leading-snug">
            “{quote}”
          </p>
          {attribution ? (
            <footer className="mt-2 text-[11px] text-[var(--muted)]">{attribution}</footer>
          ) : null}
        </blockquote>
      ) : null}
      <span className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-[var(--muted)]">
        07
      </span>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="paper-wash pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute right-[-10%] top-[-8%] h-[28rem] w-[28rem] rounded-full bg-[rgba(217,119,6,0.12)] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[-12%] left-[-8%] h-[24rem] w-[24rem] rounded-full bg-[rgba(146,64,14,0.1)] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-6xl flex-col px-6 pb-28 pt-8">
        <nav className="flex items-center justify-between">
          <ChatStoryMark size="sm" href="/" />
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-xs uppercase tracking-[0.18em] text-[var(--muted)] transition hover:text-[var(--ink)]"
            >
              Privacy
            </Link>
            <Link
              href="/create/upload"
              className="rounded-sm bg-[var(--gold-deep)] px-4 py-2 text-xs font-medium tracking-wide text-[var(--paper)] transition hover:bg-[var(--accent)]"
            >
              Begin
            </Link>
          </div>
        </nav>

        <section className="grid items-end gap-10 pb-8 pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:pt-24">
          <div>
            <p className="hero-fade font-[family-name:var(--font-jost)] text-xs uppercase tracking-[0.28em] text-[var(--gold-deep)]">
              A keepsake from your chat
            </p>
            <div className="hero-rise mt-5">
              <ChatStoryMark size="hero" href="/create/upload" />
            </div>
            <h1 className="hero-rise mt-8 max-w-xl font-[family-name:var(--font-cormorant)] text-3xl leading-[1.12] text-[var(--ink)] sm:text-4xl md:text-5xl">
              Your WhatsApp chat is already a love story.
            </h1>
            <p className="hero-rise mt-5 max-w-md font-[family-name:var(--font-eb-garamond)] text-xl leading-relaxed text-[var(--ink-soft)]">
              We read the quiet parts. The late replies. The word you said too
              many times. Then we turn them into pages you can hold.
            </p>
            <div className="hero-rise mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/create/upload"
                className="inline-flex items-center justify-center rounded-sm bg-[var(--gold-deep)] px-8 py-3.5 text-sm font-medium tracking-wide text-[var(--paper)] transition hover:bg-[var(--accent)]"
              >
                Upload your chat
              </Link>
              <p className="text-sm text-[var(--muted)]">
                Free preview. Unlock the full PDF for Rs.49.
              </p>
            </div>
            <p className="hero-rise mt-12 max-w-sm text-sm leading-relaxed text-[var(--muted)]">
              Your story is deleted after you download it. We never use your chat
              to train models.
            </p>
          </div>

          <div className="hero-rise relative mx-auto w-full max-w-sm lg:mx-0 lg:justify-self-end">
            <div className="absolute -left-6 top-10 hidden w-40 -rotate-6 sm:block">
              <SamplePage
                tone="ghibli"
                kicker="Ghibli Soft"
                title="Soft evenings"
                body="Sky meadows. Photos restyled as painted frames."
              />
            </div>
            <div className="relative z-10 rotate-2">
              <SamplePage
                tone="gold"
                kicker="Elegant Gold"
                title="How it started"
                body="The first nights were ordinary messages that somehow stayed."
                quote="okay but tell me when you reach"
                attribution="Ada · 9:49 pm"
              />
            </div>
            <div className="absolute -right-4 bottom-8 hidden w-36 rotate-6 sm:block">
              <SamplePage
                tone="ink"
                kicker="Minimal Ink"
                title="The Numbers"
                body="39,985 messages. 54 silent days. The math of a relationship."
              />
            </div>
          </div>
        </section>

        <section className="mt-24 border-t border-[var(--rule)] pt-16">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="font-[family-name:var(--font-jost)] text-xs uppercase tracking-[0.22em] text-[var(--gold-deep)]">
                Templates
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-3xl text-[var(--ink)] sm:text-4xl">
                Four looks. Pick one for your book.
              </h2>
            </div>
            <p className="font-[family-name:var(--font-eb-garamond)] text-lg text-[var(--ink-soft)]">
              Each template is a full layout, not only a color swap. Ghibli Soft
              also restyles your uploaded photos into painted frames.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TEMPLATES.map((t) => (
              <div
                key={t.id}
                className="rounded-sm border border-[var(--rule)] bg-[rgba(255,251,235,0.55)] p-4 shadow-[var(--shadow)]"
              >
                <TemplateMiniPreview id={t.id} />
                <p className="mt-3 font-[family-name:var(--font-cormorant)] text-xl">
                  {t.name}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">{t.blurb}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24 border-t border-[var(--rule)] pt-16">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="font-[family-name:var(--font-jost)] text-xs uppercase tracking-[0.22em] text-[var(--gold-deep)]">
                Chapter one
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-3xl text-[var(--ink)] sm:text-4xl">
                What the PDF feels like
              </h2>
            </div>
            <p className="font-[family-name:var(--font-eb-garamond)] text-lg text-[var(--ink-soft)]">
              Cover, dedication, chapters with verbatim quotes, a numbers page,
              and a timeline. Print-ready. Watermarked until you unlock.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <SamplePage
              tone="gold"
              kicker="Elegant Gold"
              title="How it started"
              body="Centered classic. Gold rules. Quiet serif titles."
              quote="okay but tell me when you reach"
              attribution="Ada · 9:49 pm"
            />
            <SamplePage
              tone="ink"
              kicker="Minimal Ink"
              title="The Numbers"
              body="Editorial left align. Huge pull quotes. Black on white."
            />
            <SamplePage
              tone="pastel"
              kicker="Pastel"
              title="Timeline"
              body="Soft scrapbook bands and quote cards for gentler nights."
              quote="I still can't believe we made it"
              attribution="Ben · 11:02 pm"
            />
            <SamplePage
              tone="ghibli"
              kicker="Ghibli Soft"
              title="Path through the days"
              body="Sky-to-meadow pages. Your photos painted soft and warm."
              quote="tell me when you reach"
              attribution="Ada · 9:49 pm"
            />
          </div>
        </section>

        <section className="mt-24 border-t border-[var(--rule)] pt-16">
          <p className="font-[family-name:var(--font-jost)] text-xs uppercase tracking-[0.22em] text-[var(--gold-deep)]">
            Chapter two
          </p>
          <h2 className="mt-3 max-w-xl font-[family-name:var(--font-cormorant)] text-3xl text-[var(--ink)] sm:text-4xl">
            From export to keepsake
          </h2>
          <ol className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                n: "01",
                t: "Upload the .txt",
                d: "Export chat without media. We parse dates and words in your session.",
              },
              {
                n: "02",
                t: "See your numbers",
                d: "Free stats first. Then choose relationship, dates, chapters, template.",
              },
              {
                n: "03",
                t: "Preview, then unlock",
                d: "Read the watermarked book. Pay Rs.49 when it feels right.",
              },
            ].map((step) => (
              <li
                key={step.n}
                className="rounded-sm border border-[var(--rule)] bg-[rgba(255,251,235,0.65)] p-6 shadow-[var(--shadow)]"
              >
                <p className="text-xs tracking-[0.2em] text-[var(--gold-deep)]">
                  {step.n}
                </p>
                <h3 className="mt-3 font-[family-name:var(--font-cormorant)] text-2xl">
                  {step.t}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
                  {step.d}
                </p>
              </li>
            ))}
          </ol>
          <Link
            href="/create/upload"
            className="mt-12 inline-flex rounded-sm bg-[var(--gold-deep)] px-8 py-3.5 text-sm text-[var(--paper)] transition hover:bg-[var(--accent)]"
          >
            Start with your chat
          </Link>
        </section>
      </div>
    </main>
  );
}
