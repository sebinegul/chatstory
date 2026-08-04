import { describe, it, expect } from "vitest";
import {
  isBadQuote,
  isMeaningfulQuote,
  pickQuotes,
  quoteScore,
} from "@/lib/ai/quotes";
import { narrationForChapter } from "@/lib/ai/mock-generator";

describe("quote quality", () => {
  it("rejects logistics and emoji reactions", () => {
    expect(isMeaningfulQuote("11.30 or one hour saku andre one hour")).toBe(
      false,
    );
    expect(isMeaningfulQuote("🤣🤣 hange bag tandbidu nekkotivi😅")).toBe(false);
    expect(isBadQuote("😂😂😂")).toBe(true);
    expect(isBadQuote("ok")).toBe(true);
  });

  it("keeps personality / emotional lines", () => {
    expect(
      isMeaningfulQuote(
        "I still can't believe we pulled that trip off together",
      ),
    ).toBe(true);
    expect(
      quoteScore("Miss you guys, today felt empty without the chaos") >
        quoteScore("coming in one hour"),
    ).toBe(true);
  });

  it("pickQuotes prefers meaningful lines", () => {
    const at = new Date("2026-04-04T01:00:00Z");
    const quotes = pickQuotes(
      [
        { author: "A", body: "coming in one hour", at, deleted: false },
        { author: "B", body: "🤣🤣🤣", at, deleted: false },
        {
          author: "C",
          body: "That roast from last night still hurts in the best way",
          at,
          deleted: false,
        },
        {
          author: "A",
          body: "We should do this every year, even when life gets busy",
          at,
          deleted: false,
        },
      ],
      2,
    );
    expect(quotes).toHaveLength(2);
    expect(quotes.every((q) => !/one hour|🤣/.test(q.text))).toBe(true);
  });
});

describe("group narration", () => {
  it("does not paste raw chat into narration", () => {
    const narration = narrationForChapter({
      personA: "Ada, Ben, Cam",
      personB: "the group",
      title: "When the Chat Would Not Sleep · 04/04/2026",
      relationship: "group",
      quotes: [
        {
          text: "We should do this every year",
          author: "Ada",
          at: "2026-04-04T01:00:00.000Z",
        },
        {
          text: "That roast still hurts in the best way",
          author: "Ben",
          at: "2026-04-04T01:05:00.000Z",
        },
      ],
      messageCount: 135,
      chapterIndex: 0,
    });
    expect(narration).not.toContain("We should do this every year");
    expect(narration).not.toMatch(/typed "|said "/);
    expect(narration).not.toMatch(/\u2014/);
  });
});
