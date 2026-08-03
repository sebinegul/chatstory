"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChatStoryMark } from "@/components/brand/ChatStoryMark";
import { TemplateMiniPreview } from "@/components/configure/TemplatePicker";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { TEMPLATES } from "@/lib/templates/registry";

const FEATURES = [
  {
    title: "Upload once",
    body: "Drop a WhatsApp .txt export. We parse privately in your session.",
    span: "md:col-span-2",
  },
  {
    title: "Stats first",
    body: "Messages, silences, your celebrate word — before you pay.",
    span: "",
  },
  {
    title: "Four templates",
    body: "Velvet Letter, Quiet Type, Honey Heart, Ghibli Soft.",
    span: "",
  },
  {
    title: "Photos on preview",
    body: "After the story exists, place cover and page photos. Ghibli restyles them.",
    span: "md:col-span-2",
  },
];

const STEPS = [
  { n: "01", t: "Upload the .txt", d: "Export chat without media. We parse dates and words." },
  { n: "02", t: "Shape the book", d: "Names, relationship, chapters, and template." },
  { n: "03", t: "Preview & unlock", d: "Read the watermarked book. Unlock PDF for Rs.49." },
];

export default function HomePage() {
  const reduce = useReducedMotion();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="ambient-glow pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute left-1/2 top-24 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[rgba(45,212,191,0.12)] blur-[100px]"
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-6xl flex-col px-6 pb-28 pt-6">
        <motion.nav
          initial={reduce ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-panel sticky top-4 z-40 flex items-center justify-between rounded-full px-4 py-3 sm:px-6"
        >
          <ChatStoryMark size="sm" href="/" />
          <div className="hidden items-center gap-8 md:flex">
            <a href="#templates" className="cursor-pointer text-sm text-[var(--muted)] transition hover:text-[var(--ink)]">
              Templates
            </a>
            <a href="#how" className="cursor-pointer text-sm text-[var(--muted)] transition hover:text-[var(--ink)]">
              How it works
            </a>
            <Link href="/privacy" className="cursor-pointer text-sm text-[var(--muted)] transition hover:text-[var(--ink)]">
              Privacy
            </Link>
          </div>
          <Link href="/create/upload" className="btn-primary cursor-pointer px-5 py-2 text-sm">
            Begin
          </Link>
        </motion.nav>

        {/* Hero */}
        <section className="grid items-center gap-12 pb-8 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pt-20">
          <div>
            <FadeUp>
              <p className="inline-flex items-center gap-2 rounded-full border border-[var(--border-glass)] bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#2dd4bf]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2dd4bf] shadow-[0_0_10px_#2dd4bf]" />
                Keepsake from your chat
              </p>
            </FadeUp>
            <FadeUp delay={0.06} className="mt-6">
              <ChatStoryMark size="hero" href="/create/upload" />
            </FadeUp>
            <FadeUp delay={0.12}>
              <h1 className="mt-6 max-w-xl font-[family-name:var(--font-space)] text-3xl font-semibold leading-[1.12] tracking-tight text-[var(--ink)] sm:text-4xl md:text-5xl">
                Your WhatsApp chat is already a love story.
              </h1>
            </FadeUp>
            <FadeUp delay={0.18}>
              <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--ink-soft)] sm:text-lg">
                We read the quiet parts — late replies, the word you said too many
                times — then turn them into pages you can hold.
              </p>
            </FadeUp>
            <FadeUp delay={0.24} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/create/upload" className="btn-primary cursor-pointer px-8 py-3.5 text-sm">
                Upload your chat
              </Link>
              <Link href="#templates" className="btn-ghost cursor-pointer px-8 py-3.5 text-sm">
                See templates
              </Link>
            </FadeUp>
            <FadeUp delay={0.3}>
              <p className="mt-8 text-sm text-[var(--muted)]">
                Free preview · Rs.49 to unlock · Deleted after download
              </p>
            </FadeUp>
          </div>

          <FadeUp delay={0.15} className="relative mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
            <motion.div
              animate={reduce ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="glass-panel relative overflow-hidden rounded-[1.75rem] p-5"
            >
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[rgba(45,212,191,0.2)] blur-3xl" />
              <div className="relative overflow-hidden rounded-[1.25rem] bg-gradient-to-b from-[#f7f3ec] to-[#efe6d6] p-5 text-[#1c1917] shadow-inner">
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#8a6b3d]">
                  Elegant Gold · sample
                </p>
                <p className="mt-4 font-[family-name:var(--font-cormorant)] text-3xl">
                  How it started
                </p>
                <div className="mx-auto mt-3 h-px w-14 bg-[#b08d57]" />
                <p className="mt-5 font-[family-name:var(--font-eb-garamond)] text-sm leading-relaxed text-[#44403c]">
                  The first nights were ordinary messages that somehow stayed.
                </p>
                <blockquote className="mt-5 border-l-2 border-[#b08d57] pl-3">
                  <p className="font-[family-name:var(--font-eb-garamond)] text-base">
                    “okay but tell me when you reach”
                  </p>
                  <footer className="mt-2 text-[11px] text-[#78716c]">Ada · 9:49 pm</footer>
                </blockquote>
              </div>
              <div className="relative mt-4 grid grid-cols-3 gap-2">
                {["39k msgs", "54 silent", "Ghibli"].map((t) => (
                  <div
                    key={t}
                    className="rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-center text-[11px] text-[var(--ink-soft)]"
                  >
                    {t}
                  </div>
                ))}
              </div>
            </motion.div>
          </FadeUp>
        </section>

        {/* Bento features */}
        <section className="mt-20">
          <FadeUp>
            <p className="text-xs uppercase tracking-[0.22em] text-[#2dd4bf]">Platform</p>
            <h2 className="mt-3 font-[family-name:var(--font-space)] text-3xl font-semibold tracking-tight sm:text-4xl">
              Built like a product. Reads like a book.
            </h2>
          </FadeUp>
          <Stagger className="mt-10 grid gap-4 md:grid-cols-3">
            {FEATURES.map((f) => (
              <StaggerItem key={f.title} className={f.span}>
                <motion.div
                  whileHover={reduce ? undefined : { y: -4, scale: 1.01 }}
                  transition={{ duration: 0.25 }}
                  className="glass-panel h-full cursor-default rounded-[1.5rem] p-6"
                >
                  <div className="mb-4 h-10 w-10 rounded-xl bg-gradient-to-br from-[#2dd4bf]/30 to-[#38bdf8]/20 ring-1 ring-white/10" />
                  <h3 className="font-[family-name:var(--font-space)] text-xl font-semibold">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{f.body}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* Templates */}
        <section id="templates" className="mt-24 scroll-mt-28">
          <FadeUp>
            <p className="text-xs uppercase tracking-[0.22em] text-[#2dd4bf]">Templates</p>
            <h2 className="mt-3 font-[family-name:var(--font-space)] text-3xl font-semibold tracking-tight sm:text-4xl">
              Four looks. Pick one for your book.
            </h2>
            <p className="mt-3 max-w-2xl text-[var(--ink-soft)]">
              Each template is a full layout — not just a color swap. After preview,
              Ghibli Soft restyles photos you add into painted frames.
            </p>
          </FadeUp>
          <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEMPLATES.map((t) => (
              <StaggerItem key={t.id}>
                <motion.div
                  whileHover={reduce ? undefined : { y: -6 }}
                  className="glass-panel h-full rounded-[1.5rem] p-4"
                >
                  <TemplateMiniPreview id={t.id} />
                  <p className="mt-3 font-[family-name:var(--font-space)] text-lg font-semibold">
                    {t.name}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{t.blurb}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* How it works */}
        <section id="how" className="mt-24 scroll-mt-28">
          <FadeUp>
            <p className="text-xs uppercase tracking-[0.22em] text-[#2dd4bf]">Flow</p>
            <h2 className="mt-3 font-[family-name:var(--font-space)] text-3xl font-semibold tracking-tight sm:text-4xl">
              From export to keepsake
            </h2>
          </FadeUp>
          <Stagger className="mt-10 grid gap-4 sm:grid-cols-3">
            {STEPS.map((step) => (
              <StaggerItem key={step.n}>
                <div className="glass-panel h-full rounded-[1.5rem] p-6">
                  <p className="font-[family-name:var(--font-space)] text-sm text-[#2dd4bf]">
                    {step.n}
                  </p>
                  <h3 className="mt-3 font-[family-name:var(--font-space)] text-xl font-semibold">
                    {step.t}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{step.d}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <FadeUp className="mt-10">
            <Link href="/create/upload" className="btn-primary cursor-pointer px-8 py-3.5 text-sm">
              Start with your chat
            </Link>
          </FadeUp>
        </section>

        {/* Bottom CTA */}
        <FadeUp className="mt-24">
          <div className="glass-panel relative overflow-hidden rounded-[2rem] px-8 py-12 text-center sm:px-16">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(45,212,191,0.18),transparent_55%)]" />
            <p className="relative text-xs uppercase tracking-[0.22em] text-[#2dd4bf]">
              Ready when you are
            </p>
            <h2 className="relative mt-4 font-[family-name:var(--font-space)] text-3xl font-semibold sm:text-4xl">
              Turn tonight&apos;s chat into tomorrow&apos;s book.
            </h2>
            <Link
              href="/create/upload"
              className="btn-primary relative mt-8 inline-flex cursor-pointer px-8 py-3.5 text-sm"
            >
              Upload your chat
            </Link>
          </div>
        </FadeUp>

        <footer className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-[var(--muted)] sm:flex-row">
          <ChatStoryMark size="sm" />
          <div className="flex gap-6">
            <Link href="/privacy" className="cursor-pointer hover:text-[var(--ink)]">
              Privacy
            </Link>
            <Link href="/create/upload" className="cursor-pointer hover:text-[var(--ink)]">
              Create
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
