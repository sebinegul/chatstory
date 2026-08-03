import type { ParsedChat } from "@/lib/parser/types";
import type { ChapterIdea } from "@/lib/scanner/windows";
import type { TemplateId } from "@/lib/templates/registry";

export interface QuoteModel {
  text: string;
  author: string;
  at: string;
}

export type BookPageModel =
  | { type: "cover"; title: string; subtitle?: string }
  | { type: "dedication"; text: string }
  | {
      type: "chapter";
      title: string;
      narration: string;
      quotes: QuoteModel[];
      milestone?: string;
      startAt?: string;
      endAt?: string;
    }
  | {
      type: "numbers";
      totalMessages: number;
      daysTogether: number;
      longestSilenceDays: number;
      mostActiveDay: string;
      keyword: string;
      keywordCount: number;
    }
  | {
      type: "timeline";
      events: { at: string; label: string }[];
    };

export interface GeneratedBook {
  title: string;
  titleOptions: string[];
  dedication: string;
  pages: BookPageModel[];
}

export interface GenerateBookInput {
  chat: ParsedChat;
  personA: string;
  personB: string;
  relationship: import("@/lib/relationships").RelationshipId;
  specialDates: { label: string; date: string }[];
  chapters: ChapterIdea[];
  aiChooses: boolean;
  templateId: TemplateId;
  keyword: string;
}
