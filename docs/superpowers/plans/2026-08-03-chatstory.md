# ChatStory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build ChatStory — a Next.js webapp that turns WhatsApp `.txt` exports into a watermarked storybook preview, with mock AI generation, Prisma/SQLite persistence, and Rs.49 mock unlock for PDF download.

**Architecture:** App Router UI flow with API routes for upload/parse/stats/configure/generate/checkout/delete. Real WhatsApp parser and scanner run in code; generation and Razorpay are mock adapters with production-shaped interfaces. Book preview HTML is the source of truth for client-side PDF.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Prisma + SQLite, Vitest, html2canvas + jspdf (or pdf-lib) for client PDF.

**Spec:** `docs/superpowers/specs/2026-08-03-chatstory-design.md`

## Global Constraints

- Product name: **ChatStory** (brand-first on landing)
- Price: **Rs.49** (4900 paise)
- Visual: warm editorial keepsake — paper off-white, Cormorant/EB Garamond/Jost, gold sparingly
- No em dashes in English UI or narration copy (humanizer)
- Upload hard cap: **10 MB**; text-only WhatsApp export
- Max **15** chapters; special dates scanned **±2 days**
- Quotes must be **verbatim** from chat windows; no invented facts
- Session retention: delete on download or **48h**, whichever first
- Rate limit: **2 free previews per IP per day**
- No signup; email optional only at payment
- Mobile-first
- Apply taste-skill, emil-design-eng, ui-ux-pro-max, humanizer during UI tasks
- Do not commit unless the user explicitly asks (skip commit steps, or stage only)

---

## File Structure

```
chatstory/
├── prisma/schema.prisma
├── prisma/dev.db                    # gitignored
├── public/fonts/                    # optional local font files if needed
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # landing
│   │   ├── globals.css
│   │   ├── privacy/page.tsx
│   │   ├── create/
│   │   │   ├── upload/page.tsx
│   │   │   ├── stats/page.tsx
│   │   │   ├── configure/page.tsx
│   │   │   ├── generating/page.tsx
│   │   │   ├── preview/page.tsx
│   │   │   ├── pay/page.tsx
│   │   │   └── download/page.tsx
│   │   └── api/
│   │       ├── upload/route.ts
│   │       ├── stats/route.ts
│   │       ├── configure/route.ts
│   │       ├── generate/route.ts
│   │       ├── chapters/route.ts
│   │       ├── checkout/route.ts
│   │       └── delete/route.ts
│   ├── components/
│   │   ├── brand/ChatStoryMark.tsx
│   │   ├── flow/StepShell.tsx
│   │   ├── upload/Dropzone.tsx
│   │   ├── stats/StatsCard.tsx
│   │   ├── configure/SpecialDatesForm.tsx
│   │   ├── configure/ChaptersForm.tsx
│   │   ├── configure/TemplatePicker.tsx
│   │   ├── generate/ProgressStages.tsx
│   │   ├── book/BookViewer.tsx
│   │   ├── book/BookPage.tsx
│   │   ├── book/Watermark.tsx
│   │   ├── pay/MockRazorpayModal.tsx
│   │   └── privacy/PrivacyNotice.tsx
│   ├── lib/
│   │   ├── db.ts
│   │   ├── ip.ts
│   │   ├── rate-limit.ts
│   │   ├── session.ts
│   │   ├── parser/whatsapp.ts
│   │   ├── parser/types.ts
│   │   ├── scanner/windows.ts
│   │   ├── scanner/stats.ts
│   │   ├── ai/types.ts
│   │   ├── ai/mock-generator.ts
│   │   ├── ai/provider.ts          # interface; mock impl default
│   │   ├── payments/types.ts
│   │   ├── payments/mock-razorpay.ts
│   │   ├── templates/registry.ts
│   │   └── pdf/client-download.ts
│   └── styles/
│       ├── tokens.css
│       └── templates/
│           ├── elegant-gold.css
│           ├── minimal-ink.css
│           └── pastel.css
└── tests/
    ├── parser/whatsapp.test.ts
    ├── scanner/stats.test.ts
    ├── scanner/windows.test.ts
    └── ai/mock-generator.test.ts
```

---

### Task 1: Scaffold Next.js + Tailwind + Vitest

**Files:**
- Create: project root via `create-next-app`
- Create: `vitest.config.ts`
- Create: `src/styles/tokens.css`
- Modify: `src/app/globals.css`, `src/app/layout.tsx`
- Create: `.env`, `.gitignore` entries for `prisma/dev.db`

**Interfaces:**
- Produces: runnable `npm run dev`, `npm test`; CSS variables `--paper`, `--ink`, `--gold`, `--muted`

- [ ] **Step 1: Scaffold the app**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --turbopack
```

If the directory is not empty (docs already exist), scaffold in a temp folder and move files, or init manually with matching `package.json` scripts.

- [ ] **Step 2: Add Vitest**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @types/node
```

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

Add script: `"test": "vitest run"`.

- [ ] **Step 3: Design tokens + fonts in layout**

In `src/styles/tokens.css`:

```css
:root {
  --paper: #f7f3ec;
  --paper-deep: #efe8dc;
  --ink: #1c1917;
  --ink-soft: #44403c;
  --muted: #78716c;
  --gold: #b08d57;
  --gold-deep: #8a6b3d;
  --danger: #9f1239;
  --rule: color-mix(in srgb, var(--gold) 45%, transparent);
}
```

Load Google fonts in `layout.tsx`: Cormorant Garamond, EB Garamond, Jost. Set `body` background to `var(--paper)`, color `var(--ink)`.

- [ ] **Step 4: Verify**

```bash
npm run dev
npm test
```

Expected: app loads; vitest exits 0 with no tests (or 0 suites).

---

### Task 2: WhatsApp parser (real)

**Files:**
- Create: `src/lib/parser/types.ts`
- Create: `src/lib/parser/whatsapp.ts`
- Test: `tests/parser/whatsapp.test.ts`

**Interfaces:**
- Produces:
  - `parseWhatsAppExport(text: string): ParsedChat`
  - `ParsedChat = { participants: string[]; messages: ParsedMessage[]; firstAt: Date; lastAt: Date }`
  - `ParsedMessage = { at: Date; author: string; body: string; edited: boolean; deleted: boolean }`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { parseWhatsAppExport } from "@/lib/parser/whatsapp";

describe("parseWhatsAppExport", () => {
  it("parses US MM/DD/YY dates (3/2/26 = 2 March 2026)", () => {
    const text = `[3/2/26, 9:49:00 PM] Ada: hello
[3/3/26, 10:00:00 AM] Ben: hi`;
    const chat = parseWhatsAppExport(text);
    expect(chat.messages[0].at.getFullYear()).toBe(2026);
    expect(chat.messages[0].at.getMonth()).toBe(2); // March
    expect(chat.messages[0].at.getDate()).toBe(2);
  });

  it("filters system and media-omitted lines", () => {
    const text = `[3/2/26, 9:49:00 PM] Ada: hello
Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
[3/2/26, 9:50:00 PM] Ben: <Media omitted>
[3/2/26, 9:51:00 PM] Ada: you deleted this message`;
    const chat = parseWhatsAppExport(text);
    expect(chat.messages.every((m) => !m.body.includes("end-to-end"))).toBe(true);
    expect(chat.messages.filter((m) => m.body.includes("Media omitted")).length).toBe(0);
  });

  it("preserves emoji and Malayalam text", () => {
    const text = `[3/2/26, 9:49:00 PM] Ada: ഞാൻ സ്നേഹിക്കുന്നു ❤️`;
    const chat = parseWhatsAppExport(text);
    expect(chat.messages[0].body).toContain("❤️");
    expect(chat.messages[0].body).toContain("സ്നേഹിക്കുന്നു");
  });

  it("marks edited and deleted", () => {
    const text = `[3/2/26, 9:49:00 PM] Ada: oops <This message was edited>
[3/2/26, 9:50:00 PM] Ben: This message was deleted`;
    const chat = parseWhatsAppExport(text);
    expect(chat.messages[0].edited).toBe(true);
    expect(chat.messages[1].deleted).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- tests/parser/whatsapp.test.ts
```

- [ ] **Step 3: Implement parser**

Support line pattern:
`^\[(\d{1,2}/\d{1,2}/\d{2,4}),\s+(\d{1,2}:\d{2}(?::\d{2})?\s*[AP]M)\]\s+([^:]+):\s?(.*)$`

- Parse date as US MM/DD/YY (pad 2-digit year → 2000+)
- Multiline: continuation lines without `[` append to previous message body
- Skip lines matching encrypted notice, “created group”, “changed the subject”, `<Media omitted>`, “You deleted this message” as system (or mark deleted when body is “This message was deleted”)
- Strip trailing `<This message was edited>` and set `edited: true`
- Participants = unique authors excluding system

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- tests/parser/whatsapp.test.ts
```

---

### Task 3: Stats + window scanner

**Files:**
- Create: `src/lib/scanner/stats.ts`
- Create: `src/lib/scanner/windows.ts`
- Test: `tests/scanner/stats.test.ts`
- Test: `tests/scanner/windows.test.ts`

**Interfaces:**
- Consumes: `ParsedChat`
- Produces:
  - `computeStats(chat, keyword?: string): ChatStats`
  - `ChatStats = { totalMessages, firstAt, lastAt, longestSilenceDays, mostActiveDay, keyword, keywordCount }`
  - `buildWindows(chat, specialDates: { label: string; date: string }[]): ScanWindow[]`
  - `proposeChaptersFromScan(chat, max = 15): ChapterIdea[]`

- [ ] **Step 1: Failing stats tests**

```ts
import { describe, it, expect } from "vitest";
import { parseWhatsAppExport } from "@/lib/parser/whatsapp";
import { computeStats } from "@/lib/scanner/stats";

it("counts keyword case-insensitively", () => {
  const chat = parseWhatsAppExport(`[3/2/26, 9:00:00 PM] A: booboo
[3/2/26, 9:01:00 PM] B: BooBoo love
[3/2/26, 9:02:00 PM] A: hi`);
  const s = computeStats(chat, "booboo");
  expect(s.keywordCount).toBe(2);
  expect(s.totalMessages).toBe(3);
});
```

- [ ] **Step 2: Failing window tests**

```ts
it("includes messages within ±2 days of special date", () => {
  // messages on 3/1, 3/2, 3/5 — special date 3/2 keeps 3/1 and 3/2, drops 3/5
});
```

- [ ] **Step 3: Implement `computeStats` and `buildWindows`**

- Longest silence: max gap between consecutive message timestamps in whole days
- Most active day: calendar day with most messages (local date key YYYY-MM-DD)
- Windows: for each special date, include messages where `|dayDiff| <= 2`
- Auto chapters: first message day, last, top volume bursts, longest silence break, keyword hits — cap 15, each `{ title, startAt, endAt, tone? }`

- [ ] **Step 4: Tests PASS**

---

### Task 4: Prisma schema + db client

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`
- Create: `src/lib/session.ts`
- Create: `src/lib/ip.ts`
- Create: `src/lib/rate-limit.ts`

**Interfaces:**
- Produces: `prisma` singleton; `createSession`, `getSessionOrThrow`, `hashIp`, `assertPreviewAllowed`, `recordPreview`

- [ ] **Step 1: Install Prisma**

```bash
npm install @prisma/client
npm install -D prisma
npx prisma init --datasource-provider sqlite
```

- [ ] **Step 2: Schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Session {
  id                 String      @id @default(cuid())
  createdAt          DateTime    @default(now())
  expiresAt          DateTime
  status             String      @default("uploaded")
  privacyAcceptedAt  DateTime?
  clientIpHash       String?
  upload             ChatUpload?
  config             BookConfig?
  book               Book?
  order              Order?
  previewCount       Int         @default(0)
}

model ChatUpload {
  id         String  @id @default(cuid())
  sessionId  String  @unique
  session    Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  filename   String
  byteSize   Int
  parsedJson String
}

model BookConfig {
  id               String  @id @default(cuid())
  sessionId        String  @unique
  session          Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  personA          String
  personB          String
  specialDatesJson String
  chaptersJson     String
  templateId       String
  keyword          String  @default("")
}

model Book {
  id               String  @id @default(cuid())
  sessionId        String  @unique
  session          Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  title            String
  titleOptionsJson String
  dedication       String
  pagesJson        String
  isWatermarked    Boolean @default(true)
}

model Order {
  id          String    @id @default(cuid())
  sessionId   String    @unique
  session     Session   @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  amountPaise Int       @default(4900)
  status      String    @default("mock_pending")
  unlockedAt  DateTime?
}

model RateLimit {
  id        String   @id @default(cuid())
  ipHash    String
  dayKey    String
  previews  Int      @default(0)
  @@unique([ipHash, dayKey])
}
```

`.env`: `DATABASE_URL="file:./dev.db"`

- [ ] **Step 3: Migrate**

```bash
npx prisma migrate dev --name init
```

- [ ] **Step 4: `src/lib/db.ts` + helpers**

`createSession({ ipHash, privacyAccepted })` sets `expiresAt = now + 48h`.  
`assertPreviewAllowed(ipHash)` throws 429 if `previews >= 2` for UTC day.  
`recordPreview(ipHash)` increments.

---

### Task 5: Upload + stats API

**Files:**
- Create: `src/app/api/upload/route.ts`
- Create: `src/app/api/stats/route.ts`

**Interfaces:**
- Consumes: parser, `createSession`
- Produces:
  - `POST /api/upload` multipart `{ file, privacyAccepted: "true" }` → `{ sessionId }`
  - `GET /api/stats?sessionId=&keyword=` → `ChatStats`

- [ ] **Step 1: Implement upload route**

- Reject if `!privacyAccepted`
- Reject if size > 10 * 1024 * 1024
- Read text as UTF-8; `parseWhatsAppExport`; reject if `messages.length === 0`
- Persist `ChatUpload.parsedJson = JSON.stringify(chat)` (dates as ISO strings — add `serializeChat` / `deserializeChat` helpers)
- Return `{ sessionId }`

- [ ] **Step 2: Implement stats route**

- Load session + upload; deserialize; `computeStats(chat, keyword)`
- Return JSON stats

- [ ] **Step 3: Manual smoke**

Use curl or a tiny script with a fixture `.txt` under `tests/fixtures/sample-chat.txt`.

---

### Task 6: Configure + mock generator + generate/chapters API

**Files:**
- Create: `src/lib/ai/types.ts`
- Create: `src/lib/ai/provider.ts`
- Create: `src/lib/ai/mock-generator.ts`
- Create: `src/lib/templates/registry.ts`
- Create: `src/app/api/configure/route.ts`
- Create: `src/app/api/generate/route.ts`
- Create: `src/app/api/chapters/route.ts`
- Test: `tests/ai/mock-generator.test.ts`

**Interfaces:**
- Produces:
  - `generateBook(input: GenerateBookInput): Promise<GeneratedBook>`
  - `GeneratedBook = { title, titleOptions: string[], dedication, pages: BookPageModel[] }`
  - `BookPageModel` discriminated: `cover | dedication | chapter | numbers | timeline`
  - Chapter page: `{ type:"chapter", title, narration, quotes: { text, author, at }[], milestone?: string }`
  - Templates registry: `elegant-gold | minimal-ink | pastel`

- [ ] **Step 1: Failing generator test**

```ts
it("only quotes text that appears in windows", async () => {
  const book = await generateBook({ /* fixtures with known bodies */ });
  for (const page of book.pages.filter((p) => p.type === "chapter")) {
    for (const q of page.quotes) {
      expect(windowBodiesJoined).toContain(q.text);
    }
  }
});
```

- [ ] **Step 2: Implement mock generator**

- Shortlist via `buildWindows` / auto chapters
- Narration: 2–3 short understated sentences; no em dashes; no invented events
- Pick 1–3 real quotes from window (prefer longer emotional lines)
- Title options: 3 string variants from names
- Numbers page from `computeStats`
- Timeline from chapter date anchors
- Cap 15 chapters

- [ ] **Step 3: API routes**

`POST /api/configure` body:
`{ sessionId, personA, personB, specialDates, chapters, aiChooses, templateId, keyword }`  
Validates max 15 chapters; if `aiChooses`, store empty chapters and let generate fill.

`POST /api/generate` body `{ sessionId }`:
- `assertPreviewAllowed` + `recordPreview`
- status → generating → preview
- call `generateBook`, save `Book` with `isWatermarked: true`

`PATCH /api/chapters` body:
`{ sessionId, action: "rename"|"reorder"|"regenerate", ... }`  
Regenerate one chapter via mock generator helper `regenerateChapter`.

- [ ] **Step 4: Tests PASS**

---

### Task 7: Checkout + delete API

**Files:**
- Create: `src/lib/payments/types.ts`
- Create: `src/lib/payments/mock-razorpay.ts`
- Create: `src/app/api/checkout/route.ts`
- Create: `src/app/api/delete/route.ts`

**Interfaces:**
- Produces:
  - `createMockCheckout({ sessionId, amountPaise: 4900 }) → { orderId, amountPaise }`
  - `confirmMockPayment({ orderId }) → { unlocked: true }`
  - `POST /api/checkout` `{ sessionId, action: "create"|"confirm", orderId? }`
  - `POST /api/delete` `{ sessionId }` hard deletes session tree

- [ ] **Step 1: Implement mock payment**

On confirm: `Order.status = "paid"`, `unlockedAt = now`, `Book.isWatermarked = false`, `Session.status = "paid"`.

- [ ] **Step 2: Implement delete**

`prisma.session.delete({ where: { id } })` (cascade).

- [ ] **Step 3: Smoke both routes**

---

### Task 8: Landing page (taste + Emil + humanizer)

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/brand/ChatStoryMark.tsx`
- Modify: `src/app/globals.css` (grain/wash background)

**Interfaces:**
- Produces: brand-first first viewport; CTA → `/create/upload`

- [ ] **Step 1: Read skills before coding**

Read and apply:
- `C:\Users\sebi9\.cursor\skills\taste-skill\SKILL.md`
- `C:\Users\sebi9\.cursor\skills\emil-design-eng\SKILL.md`
- `C:\Users\sebi9\.cursor\skills\ui-ux-pro-max\SKILL.md` (or local ui-ux-pro-max)
- `C:\Users\sebi9\.cursor\skills\humanizer\SKILL.md`

- [ ] **Step 2: Build landing**

First viewport only:
- ChatStory as hero-level brand
- One headline: “Your WhatsApp chat is already a love story.”
- One supporting sentence: “We just turn the pages.”
- One CTA: “Upload your chat”
- One trust line: “Your story is deleted after you download it.”
- Dominant paper/atmosphere background (not flat white); no cards in hero; no stats row; no purple

Motion: fade/rise of brand + CTA (~2 purposeful motions).

- [ ] **Step 3: Visual check at mobile + desktop widths**

---

### Task 9: Upload + stats UI

**Files:**
- Create: `src/components/upload/Dropzone.tsx`
- Create: `src/components/privacy/PrivacyNotice.tsx`
- Create: `src/components/stats/StatsCard.tsx`
- Create: `src/components/flow/StepShell.tsx`
- Create: `src/app/create/upload/page.tsx`
- Create: `src/app/create/stats/page.tsx`

**Interfaces:**
- Consumes: `/api/upload`, `/api/stats`
- Stores `sessionId` in `sessionStorage`

- [ ] **Step 1: Upload page**

- Dropzone accepts `.txt`
- Checkbox/ack for privacy notice (link to `/privacy`)
- On success → save `sessionId` → navigate `/create/stats`
- Errors: too large, invalid format — plain language

- [ ] **Step 2: Stats page**

- Fetch stats; optional keyword input + recount
- Large numbers layout (shareable card composition)
- CTA “Continue” → `/create/configure`

- [ ] **Step 3: Manual flow test with fixture chat**

---

### Task 10: Configure + generating UI

**Files:**
- Create: `src/components/configure/SpecialDatesForm.tsx`
- Create: `src/components/configure/ChaptersForm.tsx`
- Create: `src/components/configure/TemplatePicker.tsx`
- Create: `src/components/generate/ProgressStages.tsx`
- Create: `src/app/create/configure/page.tsx`
- Create: `src/app/create/generating/page.tsx`

**Interfaces:**
- Consumes: `/api/configure`, `/api/generate`

- [ ] **Step 1: Configure page**

- Names (prefill from participants if available via stats/upload meta endpoint or embed participants in stats response — extend `GET /api/stats` to include `participants: string[]`)
- Special dates list (label + date), max ~10
- Chapters list OR toggle “AI chooses for me”
- Template picker showing 3 visual swatches
- Submit → configure API → navigate generating

- [ ] **Step 2: Generating page**

Stages animation (Emil): Reading → Finding → Writing → Designing  
Fire `POST /api/generate` on mount; on success → `/create/preview`  
On 429: show rate-limit message.

---

### Task 11: Book preview + templates

**Files:**
- Create: `src/components/book/BookViewer.tsx`
- Create: `src/components/book/BookPage.tsx`
- Create: `src/components/book/Watermark.tsx`
- Create: `src/styles/templates/elegant-gold.css`
- Create: `src/styles/templates/minimal-ink.css`
- Create: `src/styles/templates/pastel.css`
- Create: `src/app/create/preview/page.tsx`
- Create: `src/app/api/book/route.ts` (`GET ?sessionId=` returns book + templateId + isWatermarked)

**Interfaces:**
- Consumes: book JSON; chapter PATCH API

- [ ] **Step 1: Template CSS**

A4 aspect pages (`min-height` based on `210mm` width ratio), margins, gold/ink/pastel variants, quote styling larger than narration, footer page numbers.

- [ ] **Step 2: BookViewer**

Page-by-page nav; watermark overlay when `isWatermarked`; disable download affordances.

Tweaks panel: rename chapter, drag reorder, regenerate one.

- [ ] **Step 3: Preview page wired**

CTA “Unlock full book — Rs.49” → `/create/pay`

---

### Task 12: Pay + download + privacy + PDF

**Files:**
- Create: `src/components/pay/MockRazorpayModal.tsx`
- Create: `src/app/create/pay/page.tsx`
- Create: `src/app/create/download/page.tsx`
- Create: `src/app/privacy/page.tsx`
- Create: `src/lib/pdf/client-download.ts`

**Interfaces:**
- Consumes: checkout + delete APIs; BookViewer without watermark when paid

- [ ] **Step 1: Mock Razorpay modal**

UI copy: UPI / cards / netbanking; amount Rs.49; Confirm payment → `action: "confirm"` → navigate download.

- [ ] **Step 2: Download page**

Render unlocked book; “Download PDF” runs client-side capture of `#book-root` pages into PDF (jspdf + html2canvas). Optional email field (store nowhere / console stub). “Delete now” calls delete API and clears sessionStorage.

- [ ] **Step 3: Privacy page**

Plain language: processed not stored beyond 48h/download; never used for training; Razorpay handles cards; delete control.

- [ ] **Step 4: End-to-end manual test**

Upload fixture → stats → configure → generate → preview watermark → pay → PDF → delete.

---

### Task 13: Polish pass (skills)

**Files:**
- Modify: landing + flow pages + book templates as needed
- Modify: any mock narration strings in `mock-generator.ts`

- [ ] **Step 1: humanizer pass on all user-facing strings** (no em dashes, no AI sludge)
- [ ] **Step 2: Emil pass** — check easing, progress stages, page transitions; keep 2–3 motions max that matter
- [ ] **Step 3: taste / ui-ux-pro-max** — first viewport brand test; mobile layout; contrast; focus states
- [ ] **Step 4: Final verification**

```bash
npm test
npm run build
npm run dev
```

Walk full happy path + invalid file + rate limit (third generate).

---

## Spec coverage checklist

| Spec item | Task |
|-----------|------|
| Landing brand-first | 8 |
| Upload + 10MB + privacy ack | 5, 9 |
| Real parser (US dates, emoji, filters) | 2 |
| Free stats + keyword | 3, 5, 9 |
| Special dates ±2 / chapters ≤15 | 3, 6, 10 |
| 3 templates | 6, 11 |
| Mock AI + progress | 6, 10 |
| Watermarked preview + tweaks | 11 |
| Mock Rs.49 pay | 7, 12 |
| Client PDF | 12 |
| SQLite sessions | 4 |
| Delete + 48h expiry field | 4, 7, 12 |
| Rate limit 2/day | 4, 6 |
| Privacy page | 12 |
| Design skills | 8, 13 |

## Placeholder / consistency self-review

- No TBD steps remaining
- Types aligned: `ParsedChat` → stats/windows → `GenerateBookInput` → `GeneratedBook` → `Book.pagesJson`
- Amount always 4900 paise / Rs.49
- Template IDs: `elegant-gold`, `minimal-ink`, `pastel`

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-03-chatstory.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — execute tasks in this session with checkpoints  

Which approach?
