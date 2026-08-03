export type RelationshipId =
  | "couple"
  | "friends"
  | "family"
  | "siblings"
  | "tribute";

export interface RelationshipMeta {
  id: RelationshipId;
  label: string;
  blurb: string;
  voice: string;
  /** Extra story-writing rules for this bond */
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
    label: "Friends",
    blurb: "Best friends or a close group chat turned keepsake",
    voice: "warm camaraderie, humor allowed, still elegant.",
    storyGuide:
      "This is FRIENDSHIP — not dating, not romance. Frame them as friends: loyalty, inside jokes, check-ins, shared plans, teasing, showing up. Never call them lovers, partners, or a couple. No romantic yearning, longing looks, or 'us' as a romance unless a sample clearly shows that. Prefer buddy warmth over soft-focus romance.",
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
