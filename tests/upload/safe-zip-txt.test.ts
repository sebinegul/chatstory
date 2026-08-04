import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import {
  extractChatTxtFromZip,
  isUnsafeZipPath,
  SafeZipError,
} from "@/lib/upload/safe-zip-txt";

const SAMPLE_CHAT = `[3/2/26, 9:49:00 PM] Ada: hello
[3/2/26, 9:50:00 PM] Ben: hi there`;

async function zipBytes(
  files: Record<string, string | Uint8Array>,
): Promise<Uint8Array> {
  const zip = new JSZip();
  for (const [name, body] of Object.entries(files)) {
    zip.file(name, body);
  }
  return zip.generateAsync({ type: "uint8array" });
}

describe("isUnsafeZipPath", () => {
  it("blocks traversal and absolute paths", () => {
    expect(isUnsafeZipPath("../chat.txt")).toBe(true);
    expect(isUnsafeZipPath("foo/../../etc/passwd")).toBe(true);
    expect(isUnsafeZipPath("/etc/passwd")).toBe(true);
    expect(isUnsafeZipPath("C:/Windows/note.txt")).toBe(true);
    expect(isUnsafeZipPath("_chat.txt")).toBe(false);
    expect(isUnsafeZipPath("folder/_chat.txt")).toBe(false);
  });
});

describe("extractChatTxtFromZip", () => {
  it("extracts preferred WhatsApp chat txt and ignores media", async () => {
    const bytes = await zipBytes({
      "IMG-0001.jpg": new Uint8Array([0xff, 0xd8, 0xff]),
      "_chat.txt": SAMPLE_CHAT,
      "notes.txt": "not a chat",
    });
    const out = await extractChatTxtFromZip(bytes);
    expect(out.sourceName).toBe("_chat.txt");
    expect(out.text).toContain("Ada: hello");
  });

  it("prefers WhatsApp Chat*.txt names", async () => {
    const bytes = await zipBytes({
      "readme.txt": "hello",
      "WhatsApp Chat with Ada.txt": SAMPLE_CHAT,
    });
    const out = await extractChatTxtFromZip(bytes);
    expect(out.sourceName.toLowerCase()).toContain("whatsapp chat");
  });

  it("rejects nested zips", async () => {
    const inner = await zipBytes({ "_chat.txt": SAMPLE_CHAT });
    const bytes = await zipBytes({
      "outer.txt": SAMPLE_CHAT,
      "payload.zip": inner,
    });
    await expect(extractChatTxtFromZip(bytes)).rejects.toMatchObject({
      code: "ZIP_NESTED",
    } satisfies Partial<SafeZipError>);
  });

  it("rejects path traversal entries", async () => {
    // JSZip sanitizes "../" on write — craft a minimal stored zip with a raw unsafe name.
    const name = Buffer.from("../evil.txt", "utf8");
    const data = Buffer.from(SAMPLE_CHAT, "utf8");

    const u32 = (n: number) => {
      const b = Buffer.alloc(4);
      b.writeUInt32LE(n >>> 0, 0);
      return b;
    };
    const u16 = (n: number) => {
      const b = Buffer.alloc(2);
      b.writeUInt16LE(n & 0xffff, 0);
      return b;
    };

    let c = 0xffffffff;
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c2 = n;
      for (let k = 0; k < 8; k++) {
        c2 = c2 & 1 ? 0xedb88320 ^ (c2 >>> 1) : c2 >>> 1;
      }
      table[n] = c2 >>> 0;
    }
    for (let i = 0; i < data.length; i++) {
      c = table[(c ^ data[i]) & 0xff] ^ (c >>> 8);
    }
    const crcVal = (c ^ 0xffffffff) >>> 0;

    const local = Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crcVal),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
      data,
    ]);
    const central = Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x01, 0x02]),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crcVal),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(0),
      name,
    ]);
    const end = Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x05, 0x06]),
      u16(0),
      u16(0),
      u16(1),
      u16(1),
      u32(central.length),
      u32(local.length),
      u16(0),
    ]);
    const bytes = new Uint8Array(Buffer.concat([local, central, end]));

    await expect(extractChatTxtFromZip(bytes)).rejects.toMatchObject({
      code: "ZIP_UNSAFE_PATH",
    });
  });

  it("rejects archives with no txt", async () => {
    const bytes = await zipBytes({
      "photo.jpg": new Uint8Array([1, 2, 3, 4]),
    });
    await expect(extractChatTxtFromZip(bytes)).rejects.toMatchObject({
      code: "ZIP_NO_TXT",
    });
  });

  it("rejects obvious code/html payloads", async () => {
    const bytes = await zipBytes({
      "_chat.txt": "<!DOCTYPE html><html><script>alert(1)</script></html>",
    });
    await expect(extractChatTxtFromZip(bytes)).rejects.toMatchObject({
      code: "ZIP_SUSPICIOUS",
    });
  });

  it("rejects non-zip magic", async () => {
    await expect(
      extractChatTxtFromZip(new TextEncoder().encode("not a zip")),
    ).rejects.toMatchObject({ code: "NOT_ZIP" });
  });
});
