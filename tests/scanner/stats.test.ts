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

  it("suggests the most used meaningful word when no keyword given", () => {
    const chat = parseWhatsAppExport(`[3/2/26, 9:00:00 PM] A: booboo night
[3/2/26, 9:01:00 PM] B: booboo again
[3/2/26, 9:02:00 PM] A: booboo forever
[3/2/26, 9:03:00 PM] B: coffee tomorrow`);
    const s = computeStats(chat);
    expect(s.suggestedKeyword).toBe("booboo");
    expect(s.keyword).toBe("booboo");
    expect(s.keywordCount).toBe(3);
  });
});
