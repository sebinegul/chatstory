import { describe, it, expect, beforeEach } from "vitest";
import {
  RELATIONSHIP_PROMPT_FILES,
  clearPromptCache,
  getRelationshipPrompt,
  getWritingRules,
  getTitleRules,
  getHumanizerRules,
  getQualityCheckRules,
  getSystemPreamble,
  buildChapterNarrationSystem,
  buildHumanizeSystem,
  buildMandatoryChapterStack,
} from "@/lib/ai/prompts";
import type { RelationshipId } from "@/lib/relationships";

describe("prompt loader", () => {
  beforeEach(() => clearPromptCache());

  it("loads shared writing rules from prompts/", () => {
    const rules = getWritingRules();
    expect(rules).toMatch(/Writing Rules/i);
    expect(rules.length).toBeGreaterThan(40);
  });

  it("loads title generator rules", () => {
    expect(getTitleRules()).toMatch(/Generate 5 book titles/i);
  });

  it("loads humanizer.txt", () => {
    const h = getHumanizerRules();
    expect(h.length).toBeGreaterThan(80);
    expect(h).toMatch(/human|memoir|AI/i);
  });

  it("maps each UI relationship to its prompt file content", () => {
    const ids = Object.keys(RELATIONSHIP_PROMPT_FILES) as RelationshipId[];
    for (const id of ids) {
      const text = getRelationshipPrompt(id);
      expect(text.length).toBeGreaterThan(50);
      expect(text.toLowerCase()).toMatch(/relationship|goal|memorial|tribute/);
    }
  });

  it("uses couples.txt when relationship is couple", () => {
    expect(getRelationshipPrompt("couple")).toMatch(/COUPLES/i);
  });

  it("uses group.txt when relationship is group", () => {
    expect(getRelationshipPrompt("group")).toMatch(/GROUP/i);
  });

  it("uses parents.txt when relationship is family", () => {
    expect(getRelationshipPrompt("family")).toMatch(/PARENTS/i);
  });
});

describe("mandatory chapter prompt stack", () => {
  beforeEach(() => clearPromptCache());

  it("orders system → writing_rules → mid → humanizer → relationship → quality_check", () => {
    const system = getSystemPreamble();
    const writing = getWritingRules();
    const humanizer = getHumanizerRules();
    const relationship = getRelationshipPrompt("friends");
    const quality = getQualityCheckRules();
    const mid = "MID_RULE_MARKER_UNIQUE";

    const stack = buildMandatoryChapterStack({
      relationship: "friends",
      midRules: [mid],
    });

    const iSystem = stack.indexOf(system.slice(0, 40));
    const iWriting = stack.indexOf(writing.slice(0, 40));
    const iMid = stack.indexOf(mid);
    const iHumanizer = stack.indexOf(humanizer.slice(0, 40));
    const iRel = stack.indexOf(relationship.slice(0, 40));
    const iQuality = stack.indexOf(quality.slice(0, 40));

    expect(iSystem).toBeGreaterThanOrEqual(0);
    expect(iWriting).toBeGreaterThan(iSystem);
    expect(iMid).toBeGreaterThan(iWriting);
    expect(iHumanizer).toBeGreaterThan(iMid);
    expect(iRel).toBeGreaterThan(iHumanizer);
    expect(iQuality).toBeGreaterThan(iRel);
  });

  it("embeds humanizer + quality_check in chapter generation", () => {
    const system = buildChapterNarrationSystem({
      relationship: "friends",
      languageBlock: "Write in English.",
      writeIn: "English",
    });
    expect(system).toMatch(/FRIENDS/i);
    expect(system).toContain(getHumanizerRules().slice(0, 50));
    expect(system).toContain(getQualityCheckRules().slice(0, 40));
    expect(system).toMatch(/Writing Rules/i);
    expect(system).toMatch(/Every chapter must have/i);
  });

  it("humanize pass also uses the mandatory stack including humanizer.txt", () => {
    const system = buildHumanizeSystem({
      relationship: "couple",
      languageBlock: "Write in English.",
    });
    expect(system).toContain(getHumanizerRules().slice(0, 50));
    expect(system).toContain(getQualityCheckRules().slice(0, 40));
    expect(system).toMatch(/COUPLES/i);
  });
});
