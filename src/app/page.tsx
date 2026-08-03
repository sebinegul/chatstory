import Link from "next/link";
import { ChatStoryMark } from "@/components/brand/ChatStoryMark";

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
  tone?: "gold" | "ink" | "pastel";
}) {
  const bg =
    tone === "ink" ? "bg-[#fafafa]" : tone === "pastel" ? "bg-[#faf3f1]" : "bg-[#f7f3ec]";
  return (
    <div
      className={`sample-page relative aspect-[210/297] w-full overflow-hidden rounded-sm ${bg} px-6 py-7 shadow-[0_18px_40px_rgba(28,25,23,0.12)] ring-1 ring-[color-mix(in_srgb,var(--ink)_8%,transparent)]`}
    >
      <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--gold-deep)]">
        {kicker}
      </p>
      <h3 className="mt-4 font-[family-name:var(--font-cormorant)] text-2xl leading-tight text-[var(--ink)]">
        {title}
      </h3>
      <div className="mx-auto mt-3 h-px w-14 bg-[var(--gold)]" />
      <p className="mt-5 font-[family-name:var(--font-eb-garamond)] text-sm leading-relaxed text-[var(--ink-soft)]">
        {body}
      </p>
      {quote ? (
        <blockquote className="mt-5 border-l border-[var(--gold)] pl-3">
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
      <div className="relative mx-auto flex max-w-5xl flex-col px-6 pb-24 pt-8">
        <nav className="flex items-center justify-between">
          <span className="sr-only">ChatStory</span>
          <div />
          <Link
            href="/privacy"
            className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]"
          >
            Privacy
          </Link>
        </nav>

        <section className="flex flex-col items-start justify-center py-16 sm:py-20">
          <p className="hero-fade font-[family-name:var(--font-jost)] text-xs uppercase tracking-[0.28em] text-[var(--gold-deep)]">
            A keepsake from your chat
          </p>
          <div className="hero-rise mt-4">
            <ChatStoryMark size="hero" href="/create/upload" />
          </div>
          <h1 className="hero-rise mt-8 max-w-2xl font-[family-name:var(--font-cormorant)] text-3xl leading-tight text-[var(--ink)] sm:text-4xl md:text-5xl">
            Your WhatsApp chat is already a love story.
          </h1>
          <p className="hero-rise mt-4 max-w-xl font-[family-name:var(--font-eb-garamond)] text-xl text-[var(--ink-soft)]">
            We just turn the pages.
          </p>
          <div className="hero-rise mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/create/upload"
              className="inline-flex items-center justify-center rounded-sm bg-[var(--gold-deep)] px-7 py-3.5 text-sm font-medium tracking-wide text-[var(--paper)] transition hover:bg-[var(--gold)]"
            >
              Upload your chat
            </Link>
            <p className="text-sm text-[var(--muted)]">
              Free preview. Unlock the full PDF for Rs.49.
            </p>
          </div>
          <p className="hero-rise mt-12 max-w-md text-sm text-[var(--muted)]">
            Your story is deleted after you download it. We never use your chat
            to train models.
          </p>
        </section>

        <section className="border-t border-[var(--rule)] pt-16">
          <p className="font-[family-name:var(--font-jost)] text-xs uppercase tracking-[0.22em] text-[var(--gold-deep)]">
            What the PDF looks like
          </p>
          <h2 className="mt-3 max-w-2xl font-[family-name:var(--font-cormorant)] text-3xl text-[var(--ink)] sm:text-4xl">
            A quiet A4 book of your real words.
          </h2>
          <p className="mt-3 max-w-xl font-[family-name:var(--font-eb-garamond)] text-lg text-[var(--ink-soft)]">
            Cover, dedication, chapters with verbatim quotes, a numbers page,
            and a timeline. Print-ready. Watermarked until you unlock.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <SamplePage
              tone="gold"
              kicker="Elegant Gold"
              title="How it started"
              body="The first nights were ordinary messages that somehow stayed. Nothing dramatic. Just two people learning each other's timing."
              quote="okay but tell me when you reach"
              attribution="Ada · 9:49 PM"
            />
            <SamplePage
              tone="ink"
              kicker="Minimal Ink"
              title="The Numbers"
              body="39,985 messages. 54 silent days. One word said 1,327 times. The math of a relationship, printed softly on paper."
            />
            <SamplePage
              tone="pastel"
              kicker="Pastel"
              title="Timeline"
              body="First hello. Long silence. Restart. Proposal. The good days. Each date gets one quiet line, then the page ends."
              quote="I still can't believe we made it"
              attribution="Ben · 11:02 PM"
            />
          </div>
        </section>

        <section className="mt-20 border-t border-[var(--rule)] pt-16">
          <p className="font-[family-name:var(--font-jost)] text-xs uppercase tracking-[0.22em] text-[var(--gold-deep)]">
            How it works
          </p>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3">
            {[
              {
                n: "01",
                t: "Upload the .txt",
                d: "Export chat without media from WhatsApp. We read the dates and words in your browser session.",
              },
              {
                n: "02",
                t: "See your numbers",
                d: "Free stats first. Then choose relationship, special dates, chapters, and a template.",
              },
              {
                n: "03",
                t: "Preview, then unlock",
                d: "Read the watermarked book. Pay Rs.49 when it feels right. Download the PDF on your device.",
              },
            ].map((step) => (
              <li key={step.n}>
                <p className="text-xs tracking-[0.2em] text-[var(--muted)]">{step.n}</p>
                <h3 className="mt-2 font-[family-name:var(--font-cormorant)] text-2xl">
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
            className="mt-12 inline-flex rounded-sm bg-[var(--gold-deep)] px-7 py-3.5 text-sm text-[var(--paper)]"
          >
            Start with your chat
          </Link>
        </section>
      </div>
    </main>
  );
}
