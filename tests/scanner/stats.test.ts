import { describe, it, expect } from "vitest";
import { parseWhatsAppExport } from "@/lib/parser/whatsapp";
import { computeStats } from "@/lib/scanner/stats";

describe("computeStats", () => {
  it("counts keyword case-insensitively", () => {
    const chat = parseWhatsAppExport(`[3/2/26, 9:00:00 PM] A: booboo
[3/2/26, 9:01:00 PM] B: BooBoo love
[3/2/26, 9:02:00 PM] A: hi`);
    const s = computeStats(chat, "booboo");
    expect(s.keywordCount).toBe(2);
    expect(s.totalMessages).toBe(3);
  });

  it("computes longest silence in whole days", () => {
    const chat = parseWhatsAppExport(`[3/1/26, 9:00:00 PM] A: hi
[3/10/26, 9:00:00 PM] B: back`);
    const s = computeStats(chat);
    expect(s.longestSilenceDays).toBeGreaterThanOrEqual(8);
  });
});
