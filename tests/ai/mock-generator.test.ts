import { describe, it, expect } from "vitest";
import { parseWhatsAppExport } from "@/lib/parser/whatsapp";
import { generateBook } from "@/lib/ai/mock-generator";

describe("generateBook", () => {
  it("only quotes text that appears in the chat", async () => {
    const chat = parseWhatsAppExport(`[3/2/26, 9:00:00 PM] Ada: I still remember that night
[3/2/26, 9:01:00 PM] Ben: me too, forever
[3/5/26, 9:00:00 PM] Ada: coffee tomorrow?`);
    const book = await generateBook({
      chat,
      personA: "Ada",
      personB: "Ben",
      relationship: "couple",
      specialDates: [{ label: "That night", date: "2026-03-02" }],
      chapters: [],
      aiChooses: true,
      templateId: "elegant-gold",
      keyword: "forever",
    });

    const bodies = chat.messages.map((m) => m.body);
    for (const page of book.pages) {
      if (page.type !== "chapter") continue;
      for (const q of page.quotes) {
        expect(bodies).toContain(q.text);
      }
      expect(page.narration).not.toMatch(/\u2014/);
    }
  });
});
