import type { ParsedChat } from "@/lib/parser/types";
import type { ChapterIdea } from "@/lib/scanner/windows";
import type { TemplateId } from "@/lib/templates/registry";
import type { ExtraBookImage } from "@/lib/media";

export interface QuoteModel {
  text: string;
  author: string;
  at: string;
}

export type BookPageModel =
  | {
      type: "cover";
      title: string;
      subtitle?: string;
      imageUrl?: string;
    }
  | {
      type: "dedication";
      text: string;
      imageUrl?: string;
      imageCaption?: string;
    }
  | {
      type: "chapter";
      title: string;
      narration: string;
      quotes: QuoteModel[];
      milestone?: string;
      startAt?: string;
      endAt?: string;
      imageUrl?: string;
      imageCaption?: string;
    }
  | {
      type: "numbers";
      totalMessages: number;
      daysTogether: number;
      longestSilenceDays: number;
      mostActiveDay: string;
      keyword: string;
      keywordCount: number;
      imageUrl?: string;
      imageCaption?: string;
    }
  | {
      type: "timeline";
      events: { at: string; label: string }[];
      imageUrl?: string;
      imageCaption?: string;
    };

export interface GeneratedBook {
  title: string;
  titleOptions: string[];
  dedication: string;
  pages: BookPageModel[];
  /** Present on live generates — tells UI whether OpenRouter actually wrote text. */
  generation?: {
    hasOpenRouterKey: boolean;
    storyModel: string;
    aiTitle: boolean;
    aiChapters: number;
    chapterCount: number;
    usedAi: boolean;
    notes: string[];
  };
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
  /** Optional; no longer shapes titles/narration. Kept for Numbers page auto-stat. */
  keyword?: string;
  coverImage?: string;
  extraImages?: ExtraBookImage[];
}
