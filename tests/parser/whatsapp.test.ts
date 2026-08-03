import { describe, it, expect } from "vitest";
import { parseWhatsAppExport } from "@/lib/parser/whatsapp";

describe("parseWhatsAppExport", () => {
  it("parses US MM/DD/YY dates (3/2/26 = 2 March 2026)", () => {
    const text = `[3/2/26, 9:49:00 PM] Ada: hello
[3/3/26, 10:00:00 AM] Ben: hi`;
    const chat = parseWhatsAppExport(text);
    expect(chat.messages[0].at.getFullYear()).toBe(2026);
    expect(chat.messages[0].at.getMonth()).toBe(2); // March
    expect(chat.messages[0].at.getDate()).toBe(2);
  });

  it("filters system and media-omitted lines", () => {
    const text = `[3/2/26, 9:49:00 PM] Ada: hello
Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
[3/2/26, 9:50:00 PM] Ben: <Media omitted>
[3/2/26, 9:51:00 PM] Ada: you deleted this message`;
    const chat = parseWhatsAppExport(text);
    expect(chat.messages.every((m) => !m.body.includes("end-to-end"))).toBe(true);
    expect(chat.messages.filter((m) => m.body.includes("Media omitted")).length).toBe(0);
  });

  it("preserves emoji and Malayalam text", () => {
    const text = `[3/2/26, 9:49:00 PM] Ada: ഞാൻ സ്നേഹിക്കുന്നു ❤️`;
    const chat = parseWhatsAppExport(text);
    expect(chat.messages[0].body).toContain("❤️");
    expect(chat.messages[0].body).toContain("സ്നേഹിക്കുന്നു");
  });

  it("marks edited and deleted", () => {
    const text = `[3/2/26, 9:49:00 PM] Ada: oops <This message was edited>
[3/2/26, 9:50:00 PM] Ben: This message was deleted`;
    const chat = parseWhatsAppExport(text);
    expect(chat.messages[0].edited).toBe(true);
    expect(chat.messages[1].deleted).toBe(true);
  });

  it("parses Android dash format with 24h time (DD/MM)", () => {
    const text = `15/03/26, 21:49 - Ada: hello from android
16/03/26, 08:10 - Ben: hi back`;
    const chat = parseWhatsAppExport(text);
    expect(chat.messages).toHaveLength(2);
    expect(chat.messages[0].at.getMonth()).toBe(2); // March
    expect(chat.messages[0].at.getDate()).toBe(15);
    expect(chat.messages[0].body).toBe("hello from android");
  });

  it("parses Android dash format with am/pm", () => {
    const text = `3/2/26, 9:49:00 PM - Ada: dash style`;
    const chat = parseWhatsAppExport(text);
    expect(chat.messages).toHaveLength(1);
    expect(chat.messages[0].at.getMonth()).toBe(2);
    expect(chat.messages[0].at.getDate()).toBe(2);
  });
});
