export type ImagePlacement =
  | "dedication"
  | "first-chapter"
  | "middle-chapter"
  | "last-chapter"
  | "numbers"
  | "timeline";

export interface ExtraBookImage {
  dataUrl: string;
  placement: ImagePlacement;
  caption?: string;
}

export const IMAGE_PLACEMENTS: { id: ImagePlacement; label: string }[] = [
  { id: "dedication", label: "Dedication page" },
  { id: "first-chapter", label: "First chapter" },
  { id: "middle-chapter", label: "Middle chapter" },
  { id: "last-chapter", label: "Last chapter" },
  { id: "numbers", label: "The Numbers page" },
  { id: "timeline", label: "Timeline page" },
];

/** Compress image file to a JPEG data URL suitable for DB + PDF. */
export async function fileToCompressedDataUrl(
  file: File,
  maxEdge = 1200,
  quality = 0.72,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Image must be under 8 MB before compression.");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}
