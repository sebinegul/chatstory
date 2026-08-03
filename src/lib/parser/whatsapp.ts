import type { ParsedChat, ParsedMessage } from "./types";

/** Strip BOM / LTR / RTL marks WhatsApp injects */
function cleanLine(line: string): string {
  return line.replace(/^\uFEFF/, "").replace(/[\u200e\u200f\u202a-\u202e]/g, "");
}

/**
 * Supports common WhatsApp export shapes:
 * - iOS:        [3/2/26, 9:49:00 PM] Name: message
 * - Android:    3/2/26, 9:49:00 PM - Name: message
 * - 24h:        02/03/2026, 21:49 - Name: message
 * - Date-first India DD/MM and US MM/DD (disambiguated when one side > 12)
 */
const BRACKET_PATTERN =
  /^\[(\d{1,2})\/(\d{1,2})\/(\d{2,4}),\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]\s+([^:]+):\s?(.*)$/i;

const DASH_PATTERN =
  /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\s+-\s+([^:]+):\s?(.*)$/i;

const ENCRYPTED_NOTICE = /Messages and calls are end-to-end encrypted/i;
const CREATED_GROUP = /created group/i;
const CHANGED_SUBJECT = /changed the subject/i;
const SECURITY_CODE = /security code changed/i;
const ADDED_REMOVED = / (added|removed|left|joined using|you're now an admin)/i;

function parseYear(yearRaw: number): number {
  return yearRaw < 100 ? 2000 + yearRaw : yearRaw;
}

/**
 * Unambiguous when one side > 12.
 * Ambiguous: AM/PM exports → US MM/DD; 24h exports → DD/MM (common in India).
 */
function resolveMonthDay(
  a: number,
  b: number,
  hasMeridiem: boolean,
): { month: number; day: number } {
  if (a > 12 && b <= 12) return { month: b, day: a }; // DD/MM
  if (b > 12 && a <= 12) return { month: a, day: b }; // MM/DD
  if (hasMeridiem) return { month: a, day: b }; // MM/DD
  return { month: b, day: a }; // DD/MM
}

function parseTime(timeStr: string): { hours: number; minutes: number; seconds: number } {
  const trimmed = timeStr.trim();
  const withMeridiem = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)$/i);
  if (withMeridiem) {
    let hours = Number(withMeridiem[1]);
    const minutes = Number(withMeridiem[2]);
    const seconds = withMeridiem[3] ? Number(withMeridiem[3]) : 0;
    const meridiem = withMeridiem[4].toUpperCase();
    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    return { hours, minutes, seconds };
  }

  const h24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (h24) {
    return {
      hours: Number(h24[1]),
      minutes: Number(h24[2]),
      seconds: h24[3] ? Number(h24[3]) : 0,
    };
  }

  throw new Error(`Invalid time: ${timeStr}`);
}

function parseDateParts(
  first: string,
  second: string,
  yearRaw: string,
  timeStr: string,
): Date {
  const hasMeridiem = /[AP]M/i.test(timeStr);
  const { month, day } = resolveMonthDay(
    Number(first),
    Number(second),
    hasMeridiem,
  );
  const year = parseYear(Number(yearRaw));
  const { hours, minutes, seconds } = parseTime(timeStr);
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

function isStandaloneSystemLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (ENCRYPTED_NOTICE.test(trimmed)) return true;
  return false;
}

function shouldSkipMessage(body: string, author: string): boolean {
  const trimmed = body.trim();
  if (trimmed === "<Media omitted>" || trimmed === "<media omitted>") return true;
  if (/^image omitted$/i.test(trimmed)) return true;
  if (/^video omitted$/i.test(trimmed)) return true;
  if (/^audio omitted$/i.test(trimmed)) return true;
  if (/^sticker omitted$/i.test(trimmed)) return true;
  if (/^GIF omitted$/i.test(trimmed)) return true;
  if (/^document omitted$/i.test(trimmed)) return true;
  if (trimmed.toLowerCase() === "you deleted this message") return true;
  if (ENCRYPTED_NOTICE.test(trimmed)) return true;
  if (CREATED_GROUP.test(trimmed)) return true;
  if (CHANGED_SUBJECT.test(trimmed)) return true;
  if (SECURITY_CODE.test(trimmed)) return true;
  // System-ish authors
  if (!author.includes(":") && ADDED_REMOVED.test(`${author}: ${trimmed}`)) {
    /* fall through — body checks below */
  }
  if (ADDED_REMOVED.test(trimmed) && !trimmed.includes(" ")) {
    return true;
  }
  return false;
}

function parseMessageBody(body: string): {
  body: string;
  edited: boolean;
  deleted: boolean;
} {
  let edited = false;
  let text = body;

  const editedSuffixes = [
    " <This message was edited>",
    " (edited)",
    " <This message was edited",
  ];
  for (const suffix of editedSuffixes) {
    if (text.endsWith(suffix)) {
      text = text.slice(0, -suffix.length);
      edited = true;
      break;
    }
  }
  if (/<This message was edited>/i.test(text)) {
    text = text.replace(/\s*<This message was edited>/gi, "");
    edited = true;
  }

  if (
    text.trim() === "This message was deleted" ||
    text.trim() === "You deleted this message"
  ) {
    return { body: text, edited: false, deleted: true };
  }

  return { body: text, edited, deleted: false };
}

function matchMessage(line: string): {
  first: string;
  second: string;
  year: string;
  time: string;
  author: string;
  body: string;
} | null {
  const bracket = line.match(BRACKET_PATTERN);
  if (bracket) {
    return {
      first: bracket[1],
      second: bracket[2],
      year: bracket[3],
      time: bracket[4],
      author: bracket[5],
      body: bracket[6],
    };
  }
  const dash = line.match(DASH_PATTERN);
  if (dash) {
    return {
      first: dash[1],
      second: dash[2],
      year: dash[3],
      time: dash[4],
      author: dash[5],
      body: dash[6],
    };
  }
  return null;
}

export function parseWhatsAppExport(text: string): ParsedChat {
  const lines = text.split(/\r?\n/).map(cleanLine);
  const messages: ParsedMessage[] = [];
  const participants = new Set<string>();

  for (const line of lines) {
    if (isStandaloneSystemLine(line)) continue;

    const match = matchMessage(line);
    if (match) {
      const trimmedAuthor = match.author.trim();
      if (shouldSkipMessage(match.body, trimmedAuthor)) continue;

      let at: Date;
      try {
        at = parseDateParts(match.first, match.second, match.year, match.time);
      } catch {
        continue;
      }

      const { body, edited, deleted } = parseMessageBody(match.body);
      participants.add(trimmedAuthor);
      messages.push({ at, author: trimmedAuthor, body, edited, deleted });
      continue;
    }

    if (messages.length > 0 && line.trim()) {
      messages[messages.length - 1].body += `\n${line}`;
    }
  }

  if (messages.length === 0) {
    const empty = new Date(0);
    return { participants: [], messages: [], firstAt: empty, lastAt: empty };
  }

  return {
    participants: Array.from(participants),
    messages,
    firstAt: messages[0].at,
    lastAt: messages[messages.length - 1].at,
  };
}

/** Lightweight validity check for upload UX */
export function looksLikeWhatsAppExport(text: string): boolean {
  const sample = text.slice(0, 8000);
  return (
    BRACKET_PATTERN.test(sample) ||
    DASH_PATTERN.test(sample) ||
    /\[\d{1,2}\/\d{1,2}\/\d{2,4}/.test(sample) ||
    /\d{1,2}\/\d{1,2}\/\d{2,4},\s+\d{1,2}:\d{2}/.test(sample)
  );
}
