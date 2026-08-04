import { describe, it, expect } from "vitest";
import { parseJsonFromModel } from "@/lib/ai/openrouter";
import { buildChapterNarrationSystem } from "@/lib/ai/prompts";

describe("parseJsonFromModel", () => {
  it("parses fenced JSON", () => {
    const raw = '```json\n{"chapters":[{"title":"A","narration":"hi"}]}\n```';
    expect(parseJsonFromModel<{ chapters: { title: string }[] }>(raw).chapters[0]
      .title).toBe("A");
  });

  it("wraps a bare chapters array", () => {
    const raw = `Here you go:\n[{"title":"A","narration":"soft"}]\n`;
    const parsed = parseJsonFromModel<{ chapters: { narration: string }[] }>(
      raw,
    );
    expect(parsed.chapters[0].narration).toBe("soft");
  });

  it("tolerates trailing commas", () => {
    const raw = `{"chapters":[{"title":"A","narration":"x",},],}`;
    expect(
      parseJsonFromModel<{ chapters: { title: string }[] }>(raw).chapters[0]
        .title,
    ).toBe("A");
  });
});

describe("chapter system prompt size", () => {
  it("stays compact enough for free models", () => {
    const system = buildChapterNarrationSystem({
      relationship: "group",
      languageBlock: "Write in English.",
      writeIn: "English",
    });
    // Full unclipped stack was ~10k+ and caused silent mock fallbacks
    expect(system.length).toBeLessThan(9000);
    expect(system).toMatch(/GROUP|group/i);
    expect(system).toMatch(/humanizer|human|memoir/i);
  });
});
