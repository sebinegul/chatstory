# Group chat book support

**Date:** 2026-08-04  
**Status:** Approved (Approach 1 + cap C)

## Intent

Support WhatsApp **group** exports as a first-class book type so stories include the full active cast (fun, banter, fights, plans) — not a forced two-person romance/friends framing.

## Behavior

- New relationship: `group` (“Group chat”)
- Cap: **top 8 most active** participants by message count (user can edit display names)
- Auto-suggest Group when export has **≥ 3** participants
- Duo types (couple, friends, family, siblings, tribute) unchanged
- Story voice: lively group chronicle; name the cast; allow humor, teasing, pile-ons, conflict when samples support it; never invent drama; never romance-frame the group

## Data

- No schema migration: store cast in existing fields
- For group: `personA` = comma-separated display names (up to 8), `personB` = `"the group"`
- Generators use `parseGroupCast` / `peopleLabelForBook` when `relationship === "group"`

## UI

- Configure: Group selected → list of up to 8 editable name fields prefilled from top actives
- Stats can surface participant count; configure does ranking from stored chat via API or client list + counts from stats payload

## Out of scope

- Unlimited members, per-member profile pages, removing quiet members beyond the top-8 cap UI
