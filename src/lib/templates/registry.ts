export type TemplateId =
  | "elegant-gold"
  | "minimal-ink"
  | "cute"
  | "ghibli";

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  blurb: string;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "elegant-gold",
    name: "Velvet Letter",
    blurb: "Elegant keepsake: foil rules, love-letter margins, quiet gold.",
  },
  {
    id: "minimal-ink",
    name: "Quiet Type",
    blurb: "Editorial poetry: dark covers, huge tender quotes, ink rules.",
  },
  {
    id: "cute",
    name: "Honey Heart",
    blurb: "Cute & soft: peach blush, heart stickers, playful quote bubbles.",
  },
  {
    id: "ghibli",
    name: "Ghibli Soft",
    blurb: "Meadow skies. Photos restyled as painted Ghibli frames.",
  },
];

/** Older configs may still say "pastel". */
export function normalizeTemplateId(value: string): TemplateId | null {
  if (value === "pastel") return "cute";
  if (TEMPLATES.some((t) => t.id === value)) return value as TemplateId;
  return null;
}

export function isTemplateId(value: string): value is TemplateId {
  return normalizeTemplateId(value) !== null;
}

export function isGhibliTemplate(id: string): boolean {
  return normalizeTemplateId(id) === "ghibli";
}
