# Quiet Paper UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle ChatStory’s platform UI (landing + create flow) to the approved Quiet Paper light system, without changing book templates, routes, or backend.

**Architecture:** Swap design tokens and global button/surface utilities first so most pages inherit the new look; then rebuild landing composition and StepShell; then sweep remaining components/pages for leftover glass/teal classes. Book page CSS (`.book-page`, `.book-gold`, etc.) stays light and template-specific.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, CSS variables in `src/styles/tokens.css`, Framer Motion (`framer-motion`), `next/font` (Outfit + DM Sans + existing book serifs).

**Spec:** `docs/superpowers/specs/2026-08-03-chatstory-quiet-paper-ui-design.md`

## Global Constraints

- Light theme only — no dark mode, no `ambient-glow`, no glass panels, no cyan/teal CTA glow
- Single accent: rose `#9F1239`; paper `#F7F5F2`; ink `#1C1917`
- UI fonts: Outfit (display) + DM Sans (body); remove Space Grotesk from platform chrome
- Do not modify `BookPage.tsx` template art or PDF internals
- Do not change API routes, Prisma, AI, or URL slugs
- No em-dashes (`—` / `–`) in visible marketing copy
- Motion: press `scale(0.97)` ~160ms ease-out; enters ≤250ms; never `transition: all`; honor `prefers-reduced-motion`
- CTA contrast: light text on `#9F1239` (WCAG AA)
- Prefer verification via `rg` bans + `npm run build` + visual check at 375/768/1024 (no new E2E framework)

## File map

| File | Role |
| --- | --- |
| `src/styles/tokens.css` | Quiet Paper CSS variables |
| `src/app/globals.css` | Buttons, surfaces; remove glow/glass |
| `src/app/layout.tsx` | Outfit instead of Space Grotesk |
| `src/components/brand/ChatStoryMark.tsx` | Light wordmark, rose accent |
| `src/components/flow/StepShell.tsx` | Light create chrome |
| `src/components/flow/LoadingBlock.tsx` | Rose spinner |
| `src/components/upload/Dropzone.tsx` | Light dropzone |
| `src/components/configure/TemplatePicker.tsx` | Selected rose ring |
| `src/components/stats/StatsCard.tsx` | Light stats |
| `src/components/generate/ProgressStages.tsx` | Quiet stages |
| `src/components/book/BookViewer.tsx` | Chrome labels only |
| `src/components/pay/MockRazorpayModal.tsx` | Light modal |
| `src/components/privacy/PrivacyNotice.tsx` | Accent accents |
| `src/components/motion/Reveal.tsx` | Emil timing if needed |
| `src/app/page.tsx` | Landing rebuild |
| `src/app/privacy/page.tsx` | Light privacy |
| `src/app/create/**/page.tsx` | Token/class cleanup |

---

### Task 1: Quiet Paper tokens + global utilities

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: CSS vars `--paper`, `--paper-deep`, `--surface`, `--ink`, `--ink-soft`, `--muted`, `--rule`, `--accent`, `--accent-soft`, `--danger`, `--shadow`; map `--gold` / `--gold-deep` / `--cta` / `--cta-ink` to Quiet Paper equivalents for temporary compatibility; `--font-display` → Outfit variable
- Consumes: none

- [ ] **Step 1: Replace `src/styles/tokens.css` with Quiet Paper values**

```css
:root {
  --paper: #f7f5f2;
  --paper-deep: #efece8;
  --surface: #ffffff;
  --ink: #1c1917;
  --ink-soft: #44403c;
  --muted: #78716c;
  --rule: #e7e5e4;
  --accent: #9f1239;
  --accent-soft: #fff1f2;
  --danger: #b91c1c;
  --shadow: 0 18px 50px rgba(28, 25, 23, 0.08);

  /* Compat aliases (remove usages in later tasks) */
  --gold: var(--accent);
  --gold-deep: var(--accent);
  --accent-legacy: var(--accent);
  --wash: var(--paper-deep);
  --cta: var(--accent);
  --cta-ink: #fff7f7;
  --glass: var(--surface);
  --glass-strong: var(--surface);
  --border-glass: var(--rule);
  --glow-cyan: transparent;
  --glow-blue: transparent;
}
```

- [ ] **Step 2: Rewrite `src/app/globals.css` platform utilities**

Keep `@import "tailwindcss"` and `@import "../styles/tokens.css"` and `@theme inline` (update `--font-display` to Outfit var). Replace body/button styles:

```css
body {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-dm), system-ui, sans-serif;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--accent);
  color: var(--cta-ink);
  font-weight: 600;
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1),
    background-color 160ms ease;
}
.btn-primary:hover {
  background: #881337;
}
.btn-primary:active {
  transform: scale(0.97);
}
.btn-primary:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid var(--rule);
  background: var(--surface);
  color: var(--ink);
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1),
    border-color 160ms ease, background-color 160ms ease;
}
.btn-ghost:hover {
  border-color: #d6d3d1;
  background: var(--paper-deep);
}
.btn-ghost:active {
  transform: scale(0.97);
}

.surface-panel {
  background: var(--surface);
  border: 1px solid var(--rule);
  border-radius: 1rem;
  box-shadow: var(--shadow);
}

/* Delete .ambient-glow, .glass-panel, .glass-panel-strong OR make them aliases of .surface-panel / no-op */
```

Keep `.book-page` / `.book-gold` / template book classes unchanged.

- [ ] **Step 3: Switch layout fonts to Outfit**

In `src/app/layout.tsx`:

```tsx
import { Outfit, DM_Sans, Cormorant_Garamond, EB_Garamond } from "next/font/google";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
// remove Space_Grotesk
// className on <html>: use outfit.variable instead of space.variable
```

In `globals.css` `@theme inline`:

```css
--font-display: var(--font-outfit);
```

Keep `--font-space` mapped to Outfit temporarily if many files still reference `var(--font-space)`:

```tsx
// Either keep variable name --font-space pointing at Outfit, OR
const outfit = Outfit({ variable: "--font-space", ... });
```

Prefer mapping Outfit to `--font-space` for one-pass compatibility, then later tasks can rename to `--font-outfit` if desired. Simplest:

```tsx
const outfit = Outfit({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
```

- [ ] **Step 4: Verify tokens load**

Run: `npm run build`  
Expected: compile success (warnings OK). Spot-check `tokens.css` contains `#9f1239` and not `#2dd4bf` as primary accent definition.

- [ ] **Step 5: Commit**

```bash
git add src/styles/tokens.css src/app/globals.css src/app/layout.tsx
git commit -m "style: adopt Quiet Paper tokens and light button utilities"
```

---

### Task 2: Brand mark + StepShell + loading

**Files:**
- Modify: `src/components/brand/ChatStoryMark.tsx`
- Modify: `src/components/flow/StepShell.tsx`
- Modify: `src/components/flow/LoadingBlock.tsx`

**Interfaces:**
- Consumes: Quiet Paper tokens; `.surface-panel` or surface classes from Task 1
- Produces: light StepShell used by all `/create/*` pages

- [ ] **Step 1: Restyle `ChatStoryMark`**

```tsx
<Link
  href={href}
  className={`font-[family-name:var(--font-space)] font-semibold tracking-tight text-[var(--ink)] ${sizes[size]}`}
>
  Chat
  <span className="text-[var(--accent)]">Story</span>
</Link>
```

Remove teal gradient `bg-clip-text`.

- [ ] **Step 2: Rewrite `StepShell` to Quiet Paper**

Requirements from spec:
- No `ambient-glow`, no teal blur orbs
- Thin progress track: track `bg-[var(--rule)]`, fill `bg-[var(--accent)]`, duration ≤0.35s ease-out
- Header: mark left; right = plain step label (e.g. map step→name) without cyan uppercase chrome spam — one muted “Step N of M” is enough
- Title uses display font; no extra “ChatStory” eyebrow above every title (eyebrow rationing)
- Children wrap in `surface-panel` (white + hairline), not `glass-panel`
- Enter motion: opacity + y:12, duration 0.25, ease `[0.23, 1, 0.32, 1]`; respect `useReducedMotion`

Example structure:

```tsx
<div className="min-h-[100dvh] bg-[var(--paper)]">
  <div className="h-1 w-full bg-[var(--rule)]">
    <motion.div className="h-full bg-[var(--accent)]" ... />
  </div>
  <header className="mx-auto flex max-w-3xl ...">
    <ChatStoryMark size="sm" />
    <p className="text-sm text-[var(--muted)]">Step {step} of {total}</p>
  </header>
  <main className="mx-auto max-w-3xl px-5 pb-20">
    <h1 className="font-[family-name:var(--font-space)] text-3xl ...">{title}</h1>
    {subtitle && <p className="mt-3 text-[var(--ink-soft)]">{subtitle}</p>}
    <div className="surface-panel mt-10 p-5 sm:p-8">{children}</div>
  </main>
</div>
```

- [ ] **Step 3: `LoadingBlock` spinner uses accent**

```tsx
border-t-[var(--accent)]
```

- [ ] **Step 4: Smoke-check create shell**

Run: `npm run dev` → open `http://localhost:3000/create/upload`  
Expected: light paper background, rose progress, white content panel, no teal glow.

- [ ] **Step 5: Commit**

```bash
git add src/components/brand/ChatStoryMark.tsx src/components/flow/StepShell.tsx src/components/flow/LoadingBlock.tsx
git commit -m "style: Quiet Paper brand mark and create step shell"
```

---

### Task 3: Landing page rebuild

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `ChatStoryMark`, `TemplateMiniPreview`, `TEMPLATES`, `FadeUp`/`Stagger`, `.btn-primary`
- Produces: light Quiet Paper marketing homepage

- [ ] **Step 1: Replace dark landing structure with Quiet Paper composition**

Must include:
1. **Nav:** sticky light bar (white/surface + hairline or soft shadow), mark, links (Templates / How it works / Privacy), CTA label **Start** → `/create/upload` (one signup intent; do not also say “Begin” elsewhere on page)
2. **Hero:** `min-h` content fits first viewport; grid `lg:grid-cols-2`; left: brand mark (hero or large), one headline ≤2 lines, subtext ≤20 words, one primary CTA “Start”; right: light book preview using `book-page` / `TemplateMiniPreview` — **not** glass mock
3. **How it works** (`#how`): 3 steps with varied layout (not 3 equal glass cards). Drop numbered `01/02/03` eyebrows if they feel SaaS; plain verbs OK (“Upload”, “Shape”, “Preview”)
4. **Templates** (`#templates`): horizontal/grid strip of `TemplateMiniPreview`
5. **Price / trust + final CTA**
6. **Footer** with privacy link

Remove: `ambient-glow`, teal pill eyebrow with glowing dot, `glass-panel` everywhere, duplicate CTAs with different labels for same intent, em-dashes in copy.

Hero copy example (adjust to fit ≤20-word subtext):

```tsx
<h1>Your WhatsApp chat, as a book you can hold.</h1>
<p>Upload the export. We write chapters from the real messages.</p>
<Link href="/create/upload" className="btn-primary ...">Start</Link>
```

- [ ] **Step 2: Motion check**

Use existing `FadeUp` / `Stagger` with reduced-motion support. Keep marketing motion under 300ms where possible; no perpetual glow loops.

- [ ] **Step 3: Visual QA**

Open `/` at 375 and 1024 widths.  
Expected: light page, rose CTA, asymmetric hero, book preview readable, no cyan.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "style: rebuild landing in Quiet Paper light theme"
```

---

### Task 4: Shared create components

**Files:**
- Modify: `src/components/upload/Dropzone.tsx`
- Modify: `src/components/configure/TemplatePicker.tsx`
- Modify: `src/components/stats/StatsCard.tsx`
- Modify: `src/components/generate/ProgressStages.tsx`
- Modify: `src/components/privacy/PrivacyNotice.tsx`
- Modify: `src/components/pay/MockRazorpayModal.tsx`
- Modify: `src/components/book/BookViewer.tsx` (labels/chrome only)

**Interfaces:**
- Consumes: Quiet Paper tokens / `.surface-panel` / `.btn-*`
- Produces: consistent light create widgets

- [ ] **Step 1: Dropzone**

Light dashed border `var(--rule)`, hover border `var(--accent)`, background `var(--surface)`. Remove any dark/glass styles.

- [ ] **Step 2: TemplatePicker**

Selected state: `ring-2 ring-[var(--accent)] bg-[var(--accent-soft)]`. Unselected: white + `border-[var(--rule)]`. No teal highlights.

- [ ] **Step 3: StatsCard / ProgressStages / PrivacyNotice / Pay modal / BookViewer chrome**

Replace `text-[var(--gold-deep)]` labels with `text-[var(--accent)]` or muted ink. Modal: white surface, hairline, rose primary button. Progress current dot: `bg-[var(--accent)]`.

Do **not** change `BookPage` template markup/colors for printed pages.

- [ ] **Step 4: Grep for leftover glass/glow**

Run:

```bash
rg "glass-panel|ambient-glow|#2dd4bf|#38bdf8" src
```

Expected: no matches in platform chrome (book template CSS may still have gold for Velvet Letter — that is OK inside `.book-*` only).

- [ ] **Step 5: Commit**

```bash
git add src/components/upload/Dropzone.tsx src/components/configure/TemplatePicker.tsx src/components/stats/StatsCard.tsx src/components/generate/ProgressStages.tsx src/components/privacy/PrivacyNotice.tsx src/components/pay/MockRazorpayModal.tsx src/components/book/BookViewer.tsx
git commit -m "style: Quiet Paper shared create components"
```

---

### Task 5: Create pages + privacy sweep

**Files:**
- Modify: `src/app/privacy/page.tsx`
- Modify: `src/app/create/upload/page.tsx`
- Modify: `src/app/create/stats/page.tsx`
- Modify: `src/app/create/configure/page.tsx`
- Modify: `src/app/create/generating/page.tsx`
- Modify: `src/app/create/preview/page.tsx`
- Modify: `src/app/create/pay/page.tsx`
- Modify: `src/app/create/download/page.tsx`

**Interfaces:**
- Consumes: StepShell + restyled widgets
- Produces: end-to-end light create funnel

- [ ] **Step 1: Privacy page**

Remove `ambient-glow` / `glass-panel`; use paper bg + `surface-panel`.

- [ ] **Step 2: Sweep create pages**

Replace leftover `text-[var(--gold-deep)]` / teal accents with `text-[var(--accent)]`. Ensure inputs use:

```
border border-[var(--rule)] bg-[var(--surface)] text-[var(--ink)]
```

Focus: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]`.

Preview photo panel + tweak panel: hairline surface, rose section labels (not uppercase teal SaaS chrome). Keep photo-on-preview behavior unchanged.

- [ ] **Step 3: Build + ban grep**

Run:

```bash
npm run build
rg "ambient-glow|glass-panel|glass-panel-strong" src
rg "from-\[#2dd4bf\]|to-\[#38bdf8\]|#2dd4bf|#38bdf8" src --glob "!**/BookPage.tsx"
```

Expected: build OK; no platform glass/glow; no teal gradient CTAs outside book templates.

- [ ] **Step 4: Manual flow smoke**

Walk: `/` → upload → stats → configure → (optional generating if session) → preview chrome.  
Expected: consistent Quiet Paper; book pages still light template art.

- [ ] **Step 5: Commit**

```bash
git add src/app/privacy/page.tsx src/app/create
git commit -m "style: Quiet Paper create pages and privacy"
```

---

### Task 6: Motion polish + final pre-flight

**Files:**
- Modify: `src/components/motion/Reveal.tsx` (if durations/easings off)
- Modify: `src/app/globals.css` (hover media query if missing)
- Optionally touch: `src/app/page.tsx` / `StepShell.tsx` for final copy/density fixes

**Interfaces:**
- Consumes: all prior UI
- Produces: Emil-aligned motion + taste pre-flight pass

- [ ] **Step 1: Align Reveal defaults**

```tsx
transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1], delay }}
// initial y: 12 (not 24+), opacity 0
```

Respect `useReducedMotion` → no y motion.

- [ ] **Step 2: Gate decorative hovers**

In CSS where hover transforms exist on marketing cards:

```css
@media (hover: hover) and (pointer: fine) {
  /* hover rules */
}
```

- [ ] **Step 3: Pre-flight checklist (from spec)**

- [ ] Light only, one accent rose
- [ ] No em-dashes in landing copy
- [ ] Hero fits viewport; one primary CTA intent (“Start”)
- [ ] Book templates untouched
- [ ] Focus rings visible
- [ ] `npm run build` passes
- [ ] `rg` ban list clean for glass/glow/teal CTAs

- [ ] **Step 4: Final commit**

```bash
git add src/components/motion/Reveal.tsx src/app/globals.css src/app/page.tsx
git commit -m "style: Quiet Paper motion polish and pre-flight fixes"
```

---

## Spec coverage check

| Spec section | Tasks |
| --- | --- |
| §3 Visual system (tokens, type, buttons) | 1 |
| §3.4–3.5 Motion / a11y | 1, 2, 6 |
| §4.1 Landing | 3 |
| §4.2 StepShell | 2 |
| §4.3 Create screens | 4, 5 |
| §5 Component list | 2–5 |
| §6 Out of scope (no book/API changes) | enforced in all tasks |
| §7 Success criteria | Task 6 pre-flight |

## Placeholder / consistency notes

- Compat aliases `--gold` → accent exist only so mid-migration pages don’t break; Task 4–5 should prefer `--accent` in new classnames.
- Outfit is loaded as `--font-space` temporarily to avoid a mass classname rename; optional follow-up can rename to `--font-outfit`.
