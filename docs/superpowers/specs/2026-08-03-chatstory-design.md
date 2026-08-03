# ChatStory — Design Spec

**Date:** 2026-08-03  
**Status:** Approved for implementation planning  
**Product name:** ChatStory  
**Price:** Rs.49 (impulse unlock)  
**Visual direction:** Warm editorial keepsake

---

## 1. Goal

Turn a WhatsApp chat export into an elegant emotional storybook. Users get a free watermarked preview and pay Rs.49 to download the full PDF. This build ships a complete Phase-1 UI flow with mocked AI and payment, backed by Next.js + Prisma/SQLite so real OpenRouter and Razorpay can replace mocks later without rewriting the product shape.

**Emotional core:** Sell a feeling, not a PDF. The sample pipeline (39,985 messages → an 18-page book) proved people cry. Copy and design must protect that restraint.

---

## 2. Scope (this build)

### In scope
- Landing → upload → stats teaser → configure → generating → preview → mock pay → download
- Real client/server WhatsApp `.txt` parser and stats (no AI required for stats)
- Special dates (±2 day windows), chapters (manual or mock-AI, max 15)
- 3 templates: Elegant Gold, Minimal Ink, Pastel
- Watermarked browser preview; chapter rename / reorder / regenerate
- Mock Razorpay checkout at Rs.49; unlock on success
- Client-side PDF download path after unlock
- Prisma + SQLite persistence for sessions, configs, books, orders
- Privacy page + upload-time plain-language notice + “Delete now”
- Rate limit: 2 free previews per IP per day

### Out of scope (later)
- Real OpenRouter / Razorpay / Vercel Blob / Neon
- Media zip exports, voice notes, video QR, gift mode, print hardcover
- Signup / “my books” accounts
- Localization UI (Hindi / Malayalam / Tamil)
- Phase 2–3 occasion packs and B2B

---

## 3. Architecture

```
Browser
  ├─ Landing / flow UI (App Router pages)
  ├─ Upload (.txt ≤ 10 MB)
  ├─ Book preview (HTML pages = source of truth)
  └─ Client PDF render on unlock (html2canvas / pdf-lib style)

Next.js API
  ├─ POST /api/upload      → validate, parse, create Session + ChatUpload
  ├─ GET  /api/stats       → numbers + keyword count
  ├─ POST /api/configure   → names, dates, chapters, template
  ├─ POST /api/generate    → mock AI from shortlisted windows
  ├─ PATCH /api/chapters   → rename / reorder / regenerate one
  ├─ POST /api/checkout    → mock Razorpay → Order paid
  ├─ POST /api/delete      → hard delete session tree
  └─ Rate-limit middleware (IP + preview count)

Prisma + SQLite
  Session → ChatUpload, BookConfig, Book, Order
```

**Stack**
- Next.js App Router, TypeScript, Tailwind CSS
- Prisma + SQLite (local file DB)
- Mock generation service with the same request/response shape as a future OpenRouter adapter
- Mock payment adapter with the same success callback shape as Razorpay

**Privacy behavior**
- Session expires at 48h or on download/delete, whichever first
- No training-use copy in UI
- Payment details never touch our forms (mock modal only)

---

## 4. User journey

1. **Landing** — Brand-first hero: ChatStory as the dominant name. One emotional line. One primary CTA into upload. Trust line about deletion.
2. **Upload** — Dropzone for `_chat.txt` / WhatsApp export. 10 MB hard cap. Format validation. Privacy notice must be acknowledged.
3. **Stats teaser** — Free, no signup. Show total messages, first/last date, longest silence, most active day, configurable keyword count. Shareable stats card UI (exportable image later; card layout in v1).
4. **Configure** — Person names (auto-detect from chat when possible). Special dates with labels. Chapters: user-defined (≤15) or “AI chooses for me”. Template picker (3).
5. **Generating** — Progress steps: Reading your chat → Finding your story → Writing chapters → Designing pages. Mock duration ~20–40s with real progress UI.
6. **Preview** — Full book, page by page, watermarked. Download disabled. Tweaks: rename, reorder, regenerate one chapter.
7. **Pay** — Mock Razorpay for Rs.49 (UPI-first framing in UI).
8. **Download** — Unlock PDF. Optional email field. “Delete now” destroys data.

Supporting page: **Privacy** in plain language.

---

## 5. Visual system

**Direction:** Warm editorial keepsake (aligned with proven Elegant Gold sample).

| Token | Choice |
|-------|--------|
| Background | Warm off-white paper with subtle grain/wash |
| Display type | Cormorant (or equivalent serif) for emotional headlines |
| Body type | EB Garamond for book body; quiet sans (Jost) for UI chrome |
| Accent | Gold used sparingly (rules, primary CTA, chapter ornaments) |
| Avoid | Purple gradients, default dark mode, pill clusters, emoji decoration, generic AI SaaS look |

**Motion (Emil Kowalski principles)**
- Soft step transitions between flow screens
- Progress UI that communicates stages, not a lone spinner
- Preview page change with intentional easing
- Motion for presence and hierarchy only (2–3 purposeful moments)

**Copy (humanizer)**
- Elegant, understated, short sentences
- No em dashes in English UI/marketing copy
- No cringe, no exclamation spam, no invented intimacy in mock narration beyond what windows support

**Book templates**
1. Elegant Gold — default; whitish paper, gold accents, serif titles
2. Minimal Ink — black/white, generous space
3. Pastel — soft pinks/creams for couples

Book pages: A4 proportions, consistent margins, centered chapter headers with rule line, footer page numbers, quotes larger than narration with date attribution, watermark style per template for preview.

---

## 6. Data model

### Session
- `id`, `createdAt`, `expiresAt`, `status` (`uploaded` | `configured` | `generating` | `preview` | `paid` | `deleted`)
- `privacyAcceptedAt`, `clientIpHash` (for rate limits)

### ChatUpload
- `sessionId`, `filename`, `byteSize`, `parsedJson` (messages + participants + meta)

### BookConfig
- `sessionId`, `personA`, `personB`, `specialDatesJson`, `chaptersJson`, `templateId`, `keyword`

### Book
- `sessionId`, `title`, `titleOptionsJson`, `dedication`, `pagesJson`, `isWatermarked`

### Order
- `sessionId`, `amountPaise` (4900), `status` (`mock_pending` | `paid`), `unlockedAt`

Hard delete removes Session and all children.

---

## 7. Parser + scanner (real)

**Input:** WhatsApp text-only export  
**Format:** `[12/31/26, 1:23:45 PM] Name: message`

**Must handle**
- US `MM/DD/YY` dates (e.g. `3/2/26` = 2 March 2026)
- Edited markers (keep latest text)
- Deleted markers → `(deleted)` or skip per design note
- Emoji preserved
- Malayalam / Hinglish / code-switched text not mangled
- Filter system messages and `<Media omitted>`

**Stats (code-only)**
- Total messages, first/last timestamps, longest silence gap, most active day, keyword count

**Scanner before mock AI**
- User special dates ±2 days
- If no dates: first/last, volume bursts, longest silence, keyword hits
- Cap chapters at 15
- Flag special dates with no nearby messages

**Cost rule (even for mocks):** AI/mock writer only sees shortlisted windows, never the full raw chat dump in the generation prompt payload.

---

## 8. Mock generation rules

Mirror real writing requirements:
- Tone: elegant + emotional, never cringe
- Quotes: verbatim from windows only (spelling, emoji, case)
- Narration: warm, understated; say less when the window is thin
- No invented facts, dates, or feelings
- Output: 3 title options, dedication, chapters (title + narration + 1–3 quotes + optional milestone stat), Numbers page, Timeline page

Chapter tweaks regenerate one chapter without re-billing.

---

## 9. Payments + unlock

- UI presents Rs.49 unlock via Razorpay-style mock (UPI / cards / netbanking framed)
- On mock success: Order → `paid`, Book watermark cleared for download path
- Email optional at payment step only
- Refund policy copy: free regenerates in preview; no refund after download (preview is the product)

---

## 10. Non-functionals

- Upload ≤ 10 MB
- First preview target feel: under ~60s (mocked progress)
- Mobile-first (users arrive from WhatsApp share)
- No signup for preview
- Funnel analytics hooks: upload → stats → preview → pay (console/event stubs OK in mock build)
- SEO landing copy around “turns your WhatsApp into a storybook”

---

## 11. Design skills to apply during implementation

- **taste-skill** — anti-slop landing and flow UI; brand-first first viewport
- **emil-design-eng** — polish, easing, micro-interactions, restraint
- **ui-ux-pro-max** — typography pairings, accessibility, responsive patterns
- **humanizer** — strip AI-sounding marketing and narration copy

---

## 12. Open decisions (resolved)

| Decision | Choice |
|----------|--------|
| Product name | ChatStory |
| Price | Rs.49 |
| Visual | Warm editorial keepsake |
| Build mode | Full UI + mocked AI/payment |
| Persistence | Next.js + Prisma/SQLite |
| Templates at launch | 3 |
| Stats page | Always free |
| Media at launch | Text-only |
| Auth | None in v1 |

---

## 13. Success criteria

- User can upload a real WhatsApp `.txt` and see accurate stats
- User can configure and receive a coherent watermarked book preview
- Mock payment unlocks download; delete removes data
- Landing and book preview feel like a keepsake, not a SaaS dashboard
- Code seams exist to swap mock AI and mock pay for OpenRouter and Razorpay without redesigning the flow
`}