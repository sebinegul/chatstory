import JSZip from "jszip";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_ENTRIES = 200;
const MAX_UNCOMPRESSED_TOTAL = MAX_UPLOAD_BYTES;
const MAX_UNCOMPRESSED_ENTRY = MAX_UPLOAD_BYTES;

export class SafeZipError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "SafeZipError";
    this.code = code;
  }
}

function isZipMagic(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

/** Reject zip-slip and absolute / drive paths. */
export function isUnsafeZipPath(name: string): boolean {
  const n = name.replace(/\\/g, "/");
  if (!n || n.endsWith("/")) return false;
  if (n.startsWith("/") || n.startsWith("//")) return true;
  if (/^[a-zA-Z]:/.test(n)) return true;
  const parts = n.split("/");
  return parts.some((p) => p === "..");
}

/**
 * Read filenames from the ZIP central directory (before JSZip normalizes them).
 * Returns null if the archive structure is unreadable.
 */
export function listRawZipEntryNames(bytes: Uint8Array): string[] | null {
  if (bytes.length < 22) return null;
  let eocd = -1;
  const maxScan = Math.min(bytes.length, 65557);
  for (let i = bytes.length - 22; i >= bytes.length - maxScan && i >= 0; i--) {
    if (
      bytes[i] === 0x50 &&
      bytes[i + 1] === 0x4b &&
      bytes[i + 2] === 0x05 &&
      bytes[i + 3] === 0x06
    ) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return null;

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const totalEntries = view.getUint16(eocd + 10, true);
  const centralSize = view.getUint32(eocd + 12, true);
  const centralOffset = view.getUint32(eocd + 16, true);
  if (totalEntries > MAX_ENTRIES) {
    throw new SafeZipError(
      "That zip has too many files. Export without media and try again.",
      "ZIP_TOO_MANY",
    );
  }
  if (
    centralOffset + centralSize > bytes.length ||
    centralOffset >= bytes.length
  ) {
    return null;
  }

  const names: string[] = [];
  let offset = centralOffset;
  const decoder = new TextDecoder("utf-8", { fatal: false });
  for (let i = 0; i < totalEntries; i++) {
    if (offset + 46 > bytes.length) return null;
    if (
      bytes[offset] !== 0x50 ||
      bytes[offset + 1] !== 0x4b ||
      bytes[offset + 2] !== 0x01 ||
      bytes[offset + 3] !== 0x02
    ) {
      return null;
    }
    const nameLen = view.getUint16(offset + 28, true);
    const extraLen = view.getUint16(offset + 30, true);
    const commentLen = view.getUint16(offset + 32, true);
    const nameStart = offset + 46;
    const nameEnd = nameStart + nameLen;
    if (nameEnd > bytes.length) return null;
    names.push(decoder.decode(bytes.subarray(nameStart, nameEnd)));
    offset = nameEnd + extraLen + commentLen;
  }
  return names;
}

function baseName(path: string): string {
  const n = path.replace(/\\/g, "/");
  const i = n.lastIndexOf("/");
  return i >= 0 ? n.slice(i + 1) : n;
}

function isTxtEntry(path: string): boolean {
  return baseName(path).toLowerCase().endsWith(".txt");
}

function isNestedZip(path: string): boolean {
  return baseName(path).toLowerCase().endsWith(".zip");
}

function preferScore(path: string): number {
  const base = baseName(path).toLowerCase();
  if (base === "_chat.txt") return 100;
  if (base.startsWith("whatsapp chat") && base.endsWith(".txt")) return 90;
  if (base.includes("whatsapp") && base.endsWith(".txt")) return 70;
  if (base.endsWith(".txt")) return 40;
  return 0;
}

function entryUncompressedSize(entry: JSZip.JSZipObject): number {
  const data = (entry as unknown as { _data?: { uncompressedSize?: number } })
    ._data;
  const size = data?.uncompressedSize;
  return typeof size === "number" && size >= 0 ? size : 0;
}

function looksBinaryOrCode(text: string): boolean {
  const sample = text.slice(0, 4000);
  if (sample.includes("\u0000")) return true;
  const nonPrintable = (sample.match(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g) || [])
    .length;
  if (nonPrintable > 8) return true;
  if (
    /^\s*<!DOCTYPE/i.test(sample) ||
    /^\s*<html[\s>]/i.test(sample) ||
    /^\s*<\?php/i.test(sample) ||
    /^\s*#!\//.test(sample) ||
    /^\s*package\s+[\w.]+;/m.test(sample)
  ) {
    return true;
  }
  return false;
}

export type ExtractedChatTxt = {
  text: string;
  sourceName: string;
};

/**
 * Safely pull a WhatsApp chat .txt out of a zip buffer.
 * Never writes to disk. Skips media. Rejects zip bombs / path tricks / nested zips.
 */
export async function extractChatTxtFromZip(
  bytes: Uint8Array,
): Promise<ExtractedChatTxt> {
  if (!isZipMagic(bytes)) {
    throw new SafeZipError(
      "That file is not a valid zip archive.",
      "NOT_ZIP",
    );
  }

  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new SafeZipError(
      "File is too large. Max size is 10 MB.",
      "TOO_LARGE",
    );
  }

  const rawNames = listRawZipEntryNames(bytes);
  if (rawNames) {
    for (const name of rawNames) {
      if (isUnsafeZipPath(name)) {
        throw new SafeZipError(
          "That zip has an unsafe file path and was rejected.",
          "ZIP_UNSAFE_PATH",
        );
      }
      if (isNestedZip(name)) {
        throw new SafeZipError(
          "Nested zip files are not allowed. Upload the WhatsApp export zip directly.",
          "ZIP_NESTED",
        );
      }
    }
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes, { checkCRC32: true });
  } catch {
    throw new SafeZipError(
      "Could not open that zip. Try exporting the chat again.",
      "ZIP_CORRUPT",
    );
  }

  const entries = Object.values(zip.files).filter((e) => !e.dir);
  if (entries.length === 0) {
    throw new SafeZipError("That zip is empty.", "ZIP_EMPTY");
  }
  if (entries.length > MAX_ENTRIES) {
    throw new SafeZipError(
      "That zip has too many files. Export without media and try again.",
      "ZIP_TOO_MANY",
    );
  }

  let uncompressedTotal = 0;
  const txtCandidates: JSZip.JSZipObject[] = [];

  for (const entry of entries) {
    if (isUnsafeZipPath(entry.name)) {
      throw new SafeZipError(
        "That zip has an unsafe file path and was rejected.",
        "ZIP_UNSAFE_PATH",
      );
    }
    if (isNestedZip(entry.name)) {
      throw new SafeZipError(
        "Nested zip files are not allowed. Upload the WhatsApp export zip directly.",
        "ZIP_NESTED",
      );
    }

    const size = entryUncompressedSize(entry);
    if (size > MAX_UNCOMPRESSED_ENTRY) {
      throw new SafeZipError(
        "A file inside the zip is too large after unpacking.",
        "ZIP_BOMB",
      );
    }
    uncompressedTotal += size;
    if (uncompressedTotal > MAX_UNCOMPRESSED_TOTAL) {
      throw new SafeZipError(
        "That zip expands to more than 10 MB. Export without media and try again.",
        "ZIP_BOMB",
      );
    }

    if (isTxtEntry(entry.name)) {
      txtCandidates.push(entry);
    }
  }

  if (txtCandidates.length === 0) {
    throw new SafeZipError(
      "No chat .txt found in that zip. Export the chat without media from WhatsApp.",
      "ZIP_NO_TXT",
    );
  }

  txtCandidates.sort((a, b) => {
    const score = preferScore(b.name) - preferScore(a.name);
    if (score !== 0) return score;
    return entryUncompressedSize(b) - entryUncompressedSize(a);
  });

  const chosen = txtCandidates[0];
  let text: string;
  try {
    text = await chosen.async("string");
  } catch {
    throw new SafeZipError(
      "Could not read the chat file inside the zip.",
      "ZIP_READ_FAILED",
    );
  }

  if (!text.trim()) {
    throw new SafeZipError(
      "The chat file inside the zip is empty.",
      "EMPTY_TEXT",
    );
  }

  if (looksBinaryOrCode(text)) {
    throw new SafeZipError(
      "The file inside the zip does not look like a chat export.",
      "ZIP_SUSPICIOUS",
    );
  }

  return {
    text,
    sourceName: baseName(chosen.name) || "chat.txt",
  };
}
