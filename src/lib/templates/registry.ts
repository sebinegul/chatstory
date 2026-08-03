export type TemplateId =
  | "elegant-gold"
  | "minimal-ink"
  | "pastel"
  | "ghibli";

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  blurb: string;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "elegant-gold",
    name: "Elegant Gold",
    blurb: "Ornate keepsake: double gold frames, diamond rules, portrait photos.",
  },
  {
    id: "minimal-ink",
    name: "Minimal Ink",
    blurb: "Magazine editorial: full-bleed dark cover, huge pull quotes, ink rules.",
  },
  {
    id: "pastel",
    name: "Pastel",
    blurb: "Scrapbook soft: polaroids, blush shapes, tilted quote cards.",
  },
  {
    id: "ghibli",
    name: "Ghibli Soft",
    blurb: "Whimsical meadow pages. Uploaded photos are restyled in Ghibli art style.",
  },
];

export function isTemplateId(value: string): value is TemplateId {
  return TEMPLATES.some((t) => t.id === value);
}

export function isGhibliTemplate(id: string): boolean {
  return id === "ghibli";
}
