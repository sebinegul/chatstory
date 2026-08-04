"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChatStoryMark } from "@/components/brand/ChatStoryMark";
import { TemplateMiniPreview } from "@/components/configure/TemplatePicker";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { TEMPLATES } from "@/lib/templates/registry";

const STEPS = [
  {
    t: "Upload",
    d: "Export without media as .txt or .zip, then drop it in.",
  },
  {
    t: "Shape",
    d: "Names, relationship, chapters, and a template for the book.",
  },
  {
    t: "Preview",
    d: "Read the watermarked book, add photos, unlock the PDF for Rs.49.",
  },
];

export default function HomePage() {
  const reduce = useReducedMotion();

  return (
    <main className="min-h-[100dvh] bg-[var(--paper)]">
      <div className="mx-auto flex max-w-6xl flex-col px-6 pb-24 pt-6">
        <motion.nav
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          className="sticky top-4 z-40 flex h-16 items-center justify-between rounded-2xl border border-[var(--rule)] bg-[var(--surface)] px-4 shadow-[var(--shadow)] sm:px-6"
        >
          <ChatStoryMark size="sm" href="/" />
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#templates"
              className="cursor-pointer text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
            >
              Templates
            </a>
            <a
              href="#how"
              className="cursor-pointer text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
            >
              How it works
            </a>
            <Link
              href="/privacy"
              className="cursor-pointer text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
            >
              Privacy
            </Link>
          </div>
          <Link
            href="/create/upload"
            className="btn-primary cursor-pointer px-5 py-2 text-sm"
          >
            Start
          </Link>
        </motion.nav>

        <section className="grid items-center gap-10 pb-6 pt-14 lg:grid-cols-2 lg:gap-12 lg:pt-16">
          <div>
            <FadeUp>
              <ChatStoryMark size="hero" href="/create/upload" />
            </FadeUp>
            <FadeUp delay={0.05}>
              <h1 className="mt-6 max-w-xl font-[family-name:var(--font-space)] text-3xl font-semibold leading-[1.12] tracking-tight text-[var(--ink)] sm:text-4xl md:text-5xl">
                Your WhatsApp chat, as a book you can hold.
              </h1>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--ink-soft)] sm:text-lg">
                Upload the export. We write chapters from the real messages.
              </p>
            </FadeUp>
            <FadeUp delay={0.15} className="mt-8">
              <Link
                href="/create/upload"
                className="btn-primary cursor-pointer px-8 py-3.5 text-sm"
              >
                Start
              </Link>
            </FadeUp>
          </div>

          <FadeUp
            delay={0.1}
            className="relative mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end"
          >
            <div className="surface-panel overflow-hidden p-5">
              <div className="book-page book-gold overflow-hidden rounded-xl p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a6b3d]">
                  Velvet Letter
                </p>
                <p className="mt-4 font-[family-name:var(--font-cormorant)] text-3xl text-[#1c1917]">
                  How it started
                </p>
                <div className="mx-auto mt-3 h-px w-14 bg-[#b08d57]" />
                <p className="mt-5 font-[family-name:var(--font-eb-garamond)] text-sm leading-relaxed text-[#44403c]">
                  The first nights were ordinary messages that somehow stayed.
                </p>
                <blockquote className="mt-5 border-l-2 border-[#b08d57] pl-3">
                  <p className="font-[family-name:var(--font-eb-garamond)] text-base text-[#1c1917]">
                    “okay but tell me when you reach”
                  </p>
                  <footer className="mt-2 text-[11px] text-[#78716c]">
                    Ada · 9:49 pm
                  </footer>
                </blockquote>
              </div>
            </div>
          </FadeUp>
        </section>

        <section id="how" className="mt-20 scroll-mt-28">
          <FadeUp>
            <h2 className="font-[family-name:var(--font-space)] text-3xl font-semibold tracking-tight sm:text-4xl">
              From export to keepsake
            </h2>
          </FadeUp>
          <Stagger className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <StaggerItem key={step.t}>
                <h3 className="font-[family-name:var(--font-space)] text-xl font-semibold text-[var(--ink)]">
                  {step.t}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
                  {step.d}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <section id="templates" className="mt-24 scroll-mt-28">
          <FadeUp>
            <h2 className="font-[family-name:var(--font-space)] text-3xl font-semibold tracking-tight sm:text-4xl">
              Four looks for your book
            </h2>
            <p className="mt-3 max-w-xl text-[var(--ink-soft)]">
              Full layouts, not just color swaps. Add photos after preview;
              Ghibli Soft can restyle them.
            </p>
          </FadeUp>
          <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEMPLATES.map((t) => (
              <StaggerItem key={t.id}>
                <div className="surface-panel h-full p-4">
                  <TemplateMiniPreview id={t.id} />
                  <p className="mt-3 font-[family-name:var(--font-space)] text-lg font-semibold">
                    {t.name}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                    {t.blurb}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <section className="mt-24">
          <FadeUp>
            <div className="surface-panel px-8 py-12 text-center sm:px-16">
              <h2 className="font-[family-name:var(--font-space)] text-3xl font-semibold sm:text-4xl">
                Free preview. Unlock for Rs.49.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[var(--ink-soft)]">
                Chat deleted after download, or after 48 hours.
              </p>
              <Link
                href="/create/upload"
                className="btn-primary mt-8 inline-flex cursor-pointer px-8 py-3.5 text-sm"
              >
                Start
              </Link>
            </div>
          </FadeUp>
        </section>

        <footer className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[var(--rule)] pt-8 text-sm text-[var(--muted)] sm:flex-row">
          <ChatStoryMark size="sm" />
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="cursor-pointer transition-colors hover:text-[var(--ink)]"
            >
              Privacy
            </Link>
            <Link
              href="/create/upload"
              className="cursor-pointer transition-colors hover:text-[var(--ink)]"
            >
              Start
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
