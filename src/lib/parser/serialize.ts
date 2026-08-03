import type { ParsedChat, ParsedMessage } from "./types";

type SerializedMessage = Omit<ParsedMessage, "at"> & { at: string };

type SerializedChat = {
  participants: string[];
  messages: SerializedMessage[];
  firstAt: string;
  lastAt: string;
};

export function serializeChat(chat: ParsedChat): string {
  const payload: SerializedChat = {
    participants: chat.participants,
    messages: chat.messages.map((m) => ({
      ...m,
      at: m.at.toISOString(),
    })),
    firstAt: chat.firstAt.toISOString(),
    lastAt: chat.lastAt.toISOString(),
  };
  return JSON.stringify(payload);
}

export function deserializeChat(json: string): ParsedChat {
  const raw = JSON.parse(json) as SerializedChat;
  return {
    participants: raw.participants,
    messages: raw.messages.map((m) => ({
      ...m,
      at: new Date(m.at),
    })),
    firstAt: new Date(raw.firstAt),
    lastAt: new Date(raw.lastAt),
  };
}
