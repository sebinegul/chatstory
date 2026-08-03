export interface ParsedMessage {
  at: Date;
  author: string;
  body: string;
  edited: boolean;
  deleted: boolean;
}

export interface ParsedChat {
  participants: string[];
  messages: ParsedMessage[];
  firstAt: Date;
  lastAt: Date;
}
