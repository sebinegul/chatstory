# Secure WhatsApp ZIP upload

**Date:** 2026-08-04  
**Status:** Approved (Approach 1 + option A)

## Intent

Non-tech-savvy users often get a WhatsApp **`.zip`** instead of a `.txt`. Accept either; for zips, extract only the chat text securely and ignore media.

## Behavior

- Dropzone accepts `.txt` and `.zip` (max **10 MB** upload)
- Recommend export **Without media** in UI copy
- `.txt` path unchanged
- `.zip`: extract one chat `.txt` in memory → existing `looksLikeWhatsAppExport` + parser

## Security

- Magic bytes must be ZIP (`PK`)
- Max ~200 entries; reject nested `.zip`
- Block path traversal (`../`, absolute paths)
- Uncompressed total ≤ 10 MB; per-entry ≤ 10 MB (zip bomb)
- Only consider `.txt`; skip media and other types
- Prefer `_chat.txt` / `WhatsApp Chat*.txt`; else largest valid `.txt`
- UTF-8 text only — never execute, never write to disk
- Reject if not a WhatsApp export (blocks scripts/HTML/binary masquerading as txt)

## Out of scope

- Storing media, larger with-media zips, password-protected archives
