export type TemplateId = "elegant-gold" | "minimal-ink" | "pastel";

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  blurb: string;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "elegant-gold",
    name: "Elegant Gold",
    blurb: "Whitish paper, gold accents, quiet serif titles.",
  },
  {
    id: "minimal-ink",
    name: "Minimal Ink",
    blurb: "Black and white with generous space.",
  },
  {
    id: "pastel",
    name: "Pastel",
    blurb: "Soft pinks and creams for a gentle keepsake.",
  },
];

export function isTemplateId(value: string): value is TemplateId {
  return TEMPLATES.some((t) => t.id === value);
}
