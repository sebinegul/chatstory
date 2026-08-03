import { describe, it, expect } from "vitest";
import { parseWhatsAppExport } from "@/lib/parser/whatsapp";
import { buildWindows, proposeChaptersFromScan } from "@/lib/scanner/windows";

describe("buildWindows", () => {
  it("includes messages within ±2 days of special date", () => {
    const chat = parseWhatsAppExport(`[3/1/26, 9:00:00 PM] A: near
[3/2/26, 9:00:00 PM] B: day
[3/5/26, 9:00:00 PM] A: far`);
    const windows = buildWindows(chat, [{ label: "First", date: "2026-03-02" }]);
    const bodies = windows[0].messages.map((m) => m.body);
    expect(bodies).toContain("near");
    expect(bodies).toContain("day");
    expect(bodies).not.toContain("far");
  });
});

describe("proposeChaptersFromScan", () => {
  it("caps at 15 chapters", () => {
    const lines = Array.from({ length: 40 }, (_, i) => {
      const day = (i % 28) + 1;
      return `[3/${day}/26, 9:00:00 PM] A: msg${i}`;
    }).join("\n");
    const chat = parseWhatsAppExport(lines);
    expect(proposeChaptersFromScan(chat, 15).length).toBeLessThanOrEqual(15);
  });

  it("uses human chapter titles, not Burst: YYYY-MM-DD", () => {
    const lines = Array.from({ length: 30 }, (_, i) => {
      const day = (i % 10) + 1;
      return `[3/${day}/26, 9:00:00 PM] A: hello there friend ${i}`;
    }).join("\n");
    const chat = parseWhatsAppExport(lines);
    const chapters = proposeChaptersFromScan(chat, 15);
    expect(chapters.some((c) => c.title.startsWith("Burst:"))).toBe(false);
    expect(chapters[0]?.title).toBe("The Beginning");
  });
});
