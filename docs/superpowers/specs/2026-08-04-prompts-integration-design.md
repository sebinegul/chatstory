# Prompt files as AI generation source of truth

**Date:** 2026-08-04  
**Status:** Approved (Approach A)

## Intent

Use the `prompts/` folder as the editable source of truth for AI generation rules already used in the book pipeline. Relationship prompts are selected **dynamically** from the user’s configure UI choice.

## Mapping

| UI relationship | Prompt file |
|-----------------|-------------|
| `couple` | `relationship/couples.txt` |
| `friends` | `relationship/friends.txt` |
| `siblings` | `relationship/siblings.txt` |
| `family` | `relationship/parents.txt` |
| `group` | `relationship/group.txt` |
| `tribute` | `relationship/best_practices.txt` + short memorial addendum (no dedicated file yet) |

Shared files: `writing_rules`, `chapter_generation_rules`, `title_generator`, `dedication`, `quality_check`, optional `system`.

## Behavior

### Mandatory chapter prompt stack (every chapter generation + humanize pass)

In order:

1. `system.txt`
2. `writing_rules.txt`
3. **Optional mid-rules** (e.g. `chapter_generation_rules.txt`, `best_practices.txt`, task instructions) — inserted *before* humanizer
4. `humanizer.txt` (**required** — used in generation and the dedicated humanize pass)
5. `<relationship>.txt` — chosen dynamically from the configure UI
6. `quality_check.txt`

Implemented by `buildMandatoryChapterStack()` in `src/lib/ai/prompts.ts`.

- Loader caches file contents from `prompts/`
- Titles / dedication also include the same humanizer + relationship + quality files
- Changing a `.txt` file changes generation without editing TypeScript prompt strings
- Renamed `*.txt.txt` → `*.txt`

## Out of scope

Separate AI quote selection, emotion scoring, quality-check loop, ending page, timeline AI.
