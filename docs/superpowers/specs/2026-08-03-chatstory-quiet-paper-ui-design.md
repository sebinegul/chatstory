# ChatStory UI Redesign — Quiet Paper

**Date:** 2026-08-03  
**Status:** Approved in conversation; awaiting final spec sign-off before implementation plan  
**Product:** ChatStory — WhatsApp chat → keepsake storybook (Next.js)

## 1. Intent

Full visual overhaul of the **platform UI** (landing + create flow chrome). Start from scratch visually. **Light theme only** — no dark vibe, no glass SaaS chrome, no cyan/teal glow.

Printed **book page templates and PDF art stay as-is**. Backend, AI, routes, and payment logic stay as-is.

## 2. Design read

Consumer keepsake / gift product for emotional trust. Quiet, airy, gift-shop calm — not AI dashboard.

- **Direction:** Quiet Paper (chosen over Daylight Studio and Ink & Cobalt)
- **Dials:** variance 6 · motion 5 · density 3
- **Influences:** taste-skill anti-slop (landing), Emil Kowalski interaction polish (create flow), UI/UX Pro Max (a11y, spacing, forms), 21st.dev as optional inspiration only (no random component dump)

## 3. Visual system

### 3.1 Color tokens (replace current dark glass tokens)

| Token | Value | Role |
| --- | --- | --- |
| `--paper` | `#F7F5F2` | Page background (cool off-white; not warm beige/brass AI default) |
| `--paper-deep` | `#EFECE8` | Subtle section wash |
| `--surface` | `#FFFFFF` | Forms, dropzone, panels |
| `--ink` | `#1C1917` | Primary text |
| `--ink-soft` | `#44403C` | Strong secondary |
| `--muted` | `#78716C` | Secondary / helper |
| `--rule` | `#E7E5E4` | Hairlines |
| `--accent` | `#9F1239` | Single rose accent (CTA, focus, active step) |
| `--accent-soft` | `#FFF1F2` | Soft fills / selected |
| `--danger` | `#B91C1C` | Errors |
| `--shadow` | soft tinted stone shadow | Elevation when needed |

Legacy aliases (`--gold`, `--gold-deep`, `--cta`, glass/glow vars) either map to Quiet Paper equivalents or are removed from CSS usage.

### 3.2 Typography

- **UI display:** Outfit via `next/font`
- **UI body:** DM Sans (keep)
- **Book pages:** existing template fonts unchanged (Cormorant, EB Garamond, etc.)
- Retire Space Grotesk as the marketing/platform face

### 3.3 Shape & material

- Panel / input radius: 12–16px
- Primary CTAs: pill (`999px`)
- Prefer spacing + hairlines over card stacks
- No glassmorphism, no neon outer glow, no mesh ambient blobs

### 3.4 Motion (Emil)

| Interaction | Spec |
| --- | --- |
| Button press | `scale(0.97)`, ~160ms, strong ease-out |
| Enters | opacity + 8–12px `translateY`, ≤250ms |
| List stagger | 40–60ms between items |
| Transitions | Exact properties only — never `transition: all` |
| Entry scale | Never from `scale(0)`; use ≥0.95 + opacity |
| Hover | Gate with `@media (hover: hover) and (pointer: fine)` |
| Reduced motion | Honor `prefers-reduced-motion` |

### 3.5 Accessibility

- Rose CTA: light label on `#9F1239`, WCAG AA
- Visible focus ring (rose, 2px)
- Labels above inputs; errors below fields
- Primary actions ≥44×44px touch target
- `cursor-pointer` on clickable controls

## 4. Information architecture

**Routes unchanged:**

`/` → `/create/upload` → `/create/stats` → `/create/configure` → `/create/generating` → `/create/preview` → `/create/pay` → `/create/download` (+ `/privacy`)

### 4.1 Landing (`/`)

- Light header: ChatStory mark + one CTA (“Start”)
- Hero (viewport-fit): brand-first, one headline (≤2 lines), one short supporting sentence (≤20 words), one primary CTA; right side = real light book-page preview (not fake dark glass UI)
- Below hero: how it works (3 steps — not three equal feature cards), templates strip, price + trust, footer
- One theme for the whole page (light). No mid-page dark inversion.
- No em-dashes in copy. No scroll cues. Eyebrow rationing per taste-skill.

### 4.2 Create shell (`StepShell`)

- Light top bar: mark + plain step label + thin rose progress track
- Form content max-width ~720px; preview may be wider for the book
- Primary action at end of content (not a floating dark dock)
- Loading / error / empty states restyled to Quiet Paper

### 4.3 Key screens

| Screen | UI notes |
| --- | --- |
| Upload | Generous dropzone on `--surface`, clear privacy line |
| Stats | Light stats presentation; no glass cards |
| Configure | Same fields; template tiles with rose ring + soft fill when selected; note that photos are added on preview |
| Generating | Quiet staged list |
| Preview | Book templates unchanged; tweak + photo panels in Quiet Paper |
| Pay / download | Calm receipt-like layout, one clear action |
| Privacy | Match platform tokens |

## 5. Components to restyle

- `src/styles/tokens.css`, `src/app/globals.css`, `src/app/layout.tsx`
- `src/app/page.tsx` (landing)
- `src/components/brand/ChatStoryMark.tsx`
- `src/components/flow/StepShell.tsx`, `LoadingBlock.tsx`
- `src/components/upload/Dropzone.tsx`
- `src/components/configure/TemplatePicker.tsx`
- `src/components/stats/StatsCard.tsx`
- `src/components/generate/ProgressStages.tsx`
- `src/components/book/BookViewer.tsx` (chrome only)
- `src/components/pay/MockRazorpayModal.tsx`
- `src/components/privacy/PrivacyNotice.tsx`
- Create pages under `src/app/create/**` as needed for class/token cleanup
- `src/components/motion/Reveal.tsx` — keep; tune easings/durations to Emil specs

**Do not restyle:** `BookPage.tsx` template art, PDF layout internals, API routes, Prisma, AI generators.

## 6. Out of scope

- Dark mode
- New features / new routes
- Book template redesign or Ghibli art changes
- Backend, rate limits, payments logic
- Copy rewrite beyond what’s needed for hero density / banned AI tells

## 7. Success criteria

- Landing and create flow read as one light Quiet Paper product
- No remaining glass/glow/cyan CTA language in platform chrome
- Book preview still light and template-faithful
- Forms remain usable on mobile; contrast and focus meet AA
- Motion feels snappy and interruptible; reduced-motion safe

## 8. Implementation notes (for planning)

1. Swap tokens first so existing utility classes shift en masse.
2. Rewrite `.btn-primary` / `.btn-ghost` / remove `.ambient-glow` / `.glass-panel` usage.
3. Rebuild landing composition (asymmetric hero).
4. Restyle StepShell + shared form components.
5. Pass over create pages and book viewer chrome.
6. Visual QA at 375 / 768 / 1024; keyboard focus pass.
