export type RelationshipId =
  | "couple"
  | "friends"
  | "family"
  | "siblings"
  | "tribute"
  | "group";

export interface RelationshipMeta {
  id: RelationshipId;
  label: string;
  blurb: string;
  voice: string;
  /**
   * Short fallback guide for mock mode / missing files.
   * Live AI generation loads the full guide from prompts/relationship/*
   * based on the user's UI selection (see src/lib/ai/prompts.ts).
   */
  storyGuide: string;
}

export const RELATIONSHIPS: RelationshipMeta[] = [
  {
    id: "couple",
    label: "Couple / partners",
    blurb: "Dating, engaged, or married",
    voice: "warm, intimate, restrained romance. Never cringe.",
    storyGuide:
      "This is a romantic partnership. Write about closeness, care, longing, small daily rituals, and the private shorthand of two people in love. Avoid friend-group banter framing. Do not invent proposals, fights, or breakups the samples do not show.",
  },
  {
    id: "friends",
    label: "Friends (two people)",
    blurb: "Best friends — a one-to-one chat",
    voice: "warm camaraderie, humor allowed, still elegant.",
    storyGuide:
      "This is FRIENDSHIP between two people — not dating, not romance. Write about loyalty, inside jokes, check-ins, shared plans, teasing, showing up. Never frame them as lovers. Prefer buddy warmth over soft-focus romance.",
  },
  {
    id: "group",
    label: "Group chat",
    blurb: "Three or more people — banter, laughs, fights, plans",
    voice:
      "lively group chronicle, humorous when samples are funny, honest when they clash.",
    storyGuide:
      "This is a GROUP chat with multiple people. Name the cast. Capture pile-ons, inside jokes, laughter, teasing, arguments, makeups, plans, and quiet days — only when the samples support them. Never reduce the group to a romance couple. Never invent fights or reconciliations. Give different people beats when the samples do. Prefer specific names over 'everyone'.",
  },
  {
    id: "family",
    label: "Parent and child",
    blurb: "A family bond across years of messages",
    voice: "tender, respectful, generational warmth.",
    storyGuide:
      "This is a parent–child bond. Write with respect and tenderness about care, updates, worry, pride, and everyday family life. Never romantic. Never sarcastic about either person.",
  },
  {
    id: "siblings",
    label: "Siblings",
    blurb: "Brother, sister, or sibling chaos with heart",
    voice: "affectionate, lightly playful, grounded.",
    storyGuide:
      "This is a sibling bond. Allow light teasing and chaos, but keep the underlying affection clear. Not romance. Not parent–child formality.",
  },
  {
    id: "tribute",
    label: "Tribute / memorial",
    blurb: "A careful remembrance book",
    voice: "gentle, reverent, never sensational. Short sentences. Soft.",
    storyGuide:
      "This is a memorial keepsake. Write gently and briefly. Honor what remains in the messages. Never invent last words, angels, heaven speeches, or dramatic endings the chat does not contain.",
  },
];

export const GROUP_PARTICIPANT_CAP = 8;

export function isRelationshipId(value: string): value is RelationshipId {
  return RELATIONSHIPS.some((r) => r.id === value);
}

export function relationshipVoice(id: RelationshipId): string {
  return RELATIONSHIPS.find((r) => r.id === id)?.voice || RELATIONSHIPS[0].voice;
}

export function relationshipStoryGuide(id: RelationshipId): string {
  return (
    RELATIONSHIPS.find((r) => r.id === id)?.storyGuide ||
    RELATIONSHIPS[0].storyGuide
  );
}

/** Rank participants by message count (desc), then name. */
export function rankParticipantsByActivity(
  messages: { author: string }[],
  cap = GROUP_PARTICIPANT_CAP,
): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const m of messages) {
    const name = m.author.trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, cap);
}

/** Parse comma-separated cast stored in personA for group books. */
export function parseGroupCast(personA: string, personB: string): string[] {
  const fromA = personA
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (fromA.length >= 2) return fromA.slice(0, GROUP_PARTICIPANT_CAP);
  const merged = [personA, personB]
    .flatMap((s) => s.split(","))
    .map((s) => s.trim())
    .filter(
      (s) =>
        s &&
        s.toLowerCase() !== "the group" &&
        s.toLowerCase() !== "and friends",
    );
  return merged.slice(0, GROUP_PARTICIPANT_CAP);
}

export function formatGroupCastLabel(names: string[]): string {
  const clean = names.map((n) => n.trim()).filter(Boolean);
  if (clean.length === 0) return "the group";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")}, and ${clean[clean.length - 1]}`;
}

/** People line for prompts and dedications. */
export function peopleLabelForBook(
  relationship: RelationshipId,
  personA: string,
  personB: string,
): string {
  if (relationship === "group") {
    return formatGroupCastLabel(parseGroupCast(personA, personB));
  }
  return `${personA} and ${personB}`;
}
