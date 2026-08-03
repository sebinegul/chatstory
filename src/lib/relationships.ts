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
}

export const RELATIONSHIPS: RelationshipMeta[] = [
  {
    id: "couple",
    label: "Couple / partners",
    blurb: "Dating, engaged, or married",
    voice: "warm, intimate, restrained romance. Never cringe.",
  },
  {
    id: "friends",
    label: "Friends",
    blurb: "Best friends or a close group chat turned keepsake",
    voice: "warm camaraderie, humor allowed, still elegant.",
  },
  {
    id: "family",
    label: "Parent and child",
    blurb: "A family bond across years of messages",
    voice: "tender, respectful, generational warmth.",
  },
  {
    id: "siblings",
    label: "Siblings",
    blurb: "Brother, sister, or sibling chaos with heart",
    voice: "affectionate, lightly playful, grounded.",
  },
  {
    id: "tribute",
    label: "Tribute / memorial",
    blurb: "A careful remembrance book",
    voice: "gentle, reverent, never sensational. Short sentences. Soft.",
  },
];

export function isRelationshipId(value: string): value is RelationshipId {
  return RELATIONSHIPS.some((r) => r.id === value);
}

export function relationshipVoice(id: RelationshipId): string {
  return RELATIONSHIPS.find((r) => r.id === id)?.voice || RELATIONSHIPS[0].voice;
}
