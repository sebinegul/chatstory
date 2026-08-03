import type { BookPageModel } from "@/lib/ai/types";
import { normalizeTemplateId, type TemplateId } from "@/lib/templates/registry";
import { formatDateTimeDMY, formatDayKeyDMY } from "@/lib/format-date";

/** Hex-only palette — html2canvas cannot parse color-mix() / modern color(). */
const THEMES: Record<
  TemplateId,
  { bg: string; ink: string; soft: string; muted: string; accent: string; accentDeep: string }
> = {
  "elegant-gold": {
    bg: "#f7f3ec",
    ink: "#1c1917",
    soft: "#44403c",
    muted: "#78716c",
    accent: "#b08d57",
    accentDeep: "#8a6b3d",
  },
  "minimal-ink": {
    bg: "#fafafa",
    ink: "#111111",
    soft: "#333333",
    muted: "#666666",
    accent: "#222222",
    accentDeep: "#111111",
  },
  cute: {
    bg: "#fff5f7",
    ink: "#5a3040",
    soft: "#7a4555",
    muted: "#c45d75",
    accent: "#e8788c",
    accentDeep: "#e8788c",
  },
  ghibli: {
    bg: "#eef8f2",
    ink: "#2f4a3e",
    soft: "#3d5c4e",
    muted: "#5a8a9a",
    accent: "#7aab8c",
    accentDeep: "#5a8a7a",
  },
};

function theme(templateId: TemplateId) {
  return THEMES[templateId] || THEMES["elegant-gold"];
}

function formatWhen(iso: string) {
  return formatDateTimeDMY(iso);
}

function formatDay(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return formatDayKeyDMY(value);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  return formatDateTimeDMY(value).split(",")[0] || value;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function imgTag(
  url: string | undefined,
  style: string,
  caption?: string,
  captionStyle?: string,
): string {
  if (!url) return "";
  const safe = escapeHtml(url);
  return `
    <figure style="margin:24px 0;">
      <img src="${safe}" alt="" style="${style}" />
      ${
        caption
          ? `<figcaption style="${captionStyle || "margin-top:10px;text-align:center;font-size:11px;color:#78716c;"}">${escapeHtml(caption)}</figcaption>`
          : ""
      }
    </figure>`;
}

function pageCaption(page: BookPageModel): string | undefined {
  return "imageCaption" in page ? page.imageCaption : undefined;
}

function cornerOrnament(
  position: { top?: string; left?: string; right?: string; bottom?: string },
  rotate: string,
  color: string,
): string {
  const pos = [
    position.top ? `top:${position.top};` : "",
    position.left ? `left:${position.left};` : "",
    position.right ? `right:${position.right};` : "",
    position.bottom ? `bottom:${position.bottom};` : "",
  ].join("");
  return `<span style="position:absolute;${pos}width:20px;height:20px;border-left:1px solid ${color};border-top:1px solid ${color};transform:${rotate};pointer-events:none;"></span>`;
}

function pageHtml(
  page: BookPageModel,
  index: number,
  templateId: TemplateId,
): string {
  const id = normalizeTemplateId(templateId) || "elegant-gold";
  if (id === "minimal-ink") return minimalHtml(page, index);
  if (id === "cute") return cuteHtml(page, index);
  if (id === "ghibli") return ghibliHtml(page, index);
  return elegantHtml(page, index);
}

function elegantHtml(page: BookPageModel, index: number): string {
  const t = THEMES["elegant-gold"];
  const ornamentColor = t.accent + "80";
  const ornaments = `
    ${cornerOrnament({ top: "28px", left: "28px" }, "none", ornamentColor)}
    ${cornerOrnament({ top: "28px", right: "28px" }, "rotate(90deg)", ornamentColor)}
    ${cornerOrnament({ bottom: "28px", left: "28px" }, "rotate(-90deg)", ornamentColor)}
    ${cornerOrnament({ bottom: "28px", right: "28px" }, "rotate(180deg)", ornamentColor)}
  `;
  const wrap = (inner: string) => `
    <div data-pdf-page style="
      width:794px;min-height:1123px;box-sizing:border-box;padding:56px 64px;
      background:${t.bg};color:${t.ink};font-family:Georgia,'Times New Roman',serif;
      display:flex;flex-direction:column;position:relative;
    ">
      <div style="position:absolute;inset:18px;border:1px solid ${t.accent}66;pointer-events:none;"></div>
      <div style="position:absolute;inset:28px;border:1px solid ${t.accent}40;pointer-events:none;"></div>
      ${ornaments}
      <div style="position:relative;z-index:1;flex:1;display:flex;flex-direction:column;">${inner}</div>
      <div style="position:relative;z-index:1;margin-top:auto;padding-top:36px;text-align:center;font-size:11px;color:${t.muted};font-family:system-ui,sans-serif;">${index + 1}</div>
    </div>`;

  const frameImg = (url?: string, caption?: string) =>
    imgTag(
      url,
      "width:220px;height:280px;object-fit:cover;display:block;margin:0 auto;border:1px solid " +
        t.accent +
        "80;padding:10px;background:#faf6ee;box-shadow:inset 0 0 0 1px " +
        t.accent +
        "33;",
      caption,
      `margin-top:12px;text-align:center;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${t.accentDeep};font-family:system-ui,sans-serif;`,
    );

  if (page.type === "cover") {
    return wrap(`
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
        <div style="font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:${t.accentDeep};font-family:system-ui,sans-serif;">A private keepsake</div>
        ${
          page.imageUrl
            ? frameImg(page.imageUrl, pageCaption(page))
            : `<div style="margin:28px 0;width:120px;height:160px;border:1px solid ${t.accent}80;display:flex;align-items:center;justify-content:center;font-size:36px;color:${t.accent};background:#faf6ee;">❦</div>`
        }
        <div style="font-size:40px;line-height:1.15;margin-top:8px;">${escapeHtml(page.title)}</div>
        <div style="margin-top:22px;display:flex;align-items:center;gap:10px;color:${t.accent};">
          <span style="width:48px;height:1px;background:${t.accent};display:inline-block;"></span>
          <span>◆</span>
          <span style="width:48px;height:1px;background:${t.accent};display:inline-block;"></span>
        </div>
        <p style="margin-top:20px;max-width:320px;font-size:14px;font-style:italic;line-height:1.5;color:#6b5e4e;">Their words, kept gently, as they were written.</p>
      </div>`);
  }

  if (page.type === "dedication") {
    return wrap(`
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
        <div style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:${t.accentDeep};font-family:system-ui,sans-serif;">Dedication</div>
        <p style="max-width:420px;font-size:22px;font-style:italic;line-height:1.6;color:#2c241c;margin-top:28px;">${escapeHtml(page.text)}</p>
        ${frameImg(page.imageUrl, pageCaption(page))}
      </div>`);
  }

  if (page.type === "chapter") {
    const quotes = page.quotes
      .map(
        (q) => `
      <blockquote style="margin:0 0 22px;padding:12px 12px 12px 18px;border-left:2px solid ${t.accent};background:#faf6eecc;text-align:left;">
        <p style="margin:0;font-size:20px;line-height:1.5;">“${escapeHtml(q.text)}”</p>
        <footer style="margin-top:8px;font-size:12px;color:${t.accentDeep};font-family:system-ui,sans-serif;">
          ${escapeHtml(q.author)} · ${escapeHtml(formatWhen(q.at))}
        </footer>
      </blockquote>`,
      )
      .join("");
    return wrap(`
      <div style="text-align:center;font-size:10px;letter-spacing:0.32em;text-transform:uppercase;color:${t.accentDeep};font-family:system-ui,sans-serif;">A page from us</div>
      <div style="text-align:center;font-size:28px;margin-top:10px;">${escapeHtml(page.title)}</div>
      <div style="margin:14px auto 0;display:flex;align-items:center;justify-content:center;gap:8px;color:${t.accent};">
        <span style="width:40px;height:1px;background:${t.accent};"></span>
        <span>✦</span>
        <span style="width:40px;height:1px;background:${t.accent};"></span>
      </div>
      <p style="margin:28px 0 0;font-size:17px;line-height:1.75;color:#3f3428;text-align:center;">${escapeHtml(page.narration)}</p>
      ${frameImg(page.imageUrl, pageCaption(page))}
      <div style="margin-top:28px;">${quotes}</div>
      ${
        page.milestone
          ? `<p style="margin-top:28px;text-align:center;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${t.accentDeep};font-family:system-ui,sans-serif;">${escapeHtml(page.milestone)}</p>`
          : ""
      }`);
  }

  if (page.type === "numbers") {
    const row = (label: string, value: string) => `
      <div style="text-align:center;margin-bottom:22px;">
        <div style="font-size:12px;color:${t.accentDeep};font-family:system-ui,sans-serif;">${escapeHtml(label)}</div>
        <div style="font-size:28px;margin-top:4px;">${escapeHtml(value)}</div>
      </div>`;
    return wrap(`
      <div style="text-align:center;font-size:28px;">What the days kept</div>
      <div style="width:56px;height:1px;background:${t.accent};margin:14px auto 28px;"></div>
      ${frameImg(page.imageUrl, pageCaption(page))}
      ${row("Messages shared", page.totalMessages.toLocaleString("en-IN"))}
      ${row("Days held together", String(page.daysTogether))}
      ${row("Longest quiet", `${page.longestSilenceDays} days`)}
      ${row("Most alive day", formatDay(page.mostActiveDay || "") || "—")}
      ${page.keyword ? row(`Times you said “${page.keyword}”`, page.keywordCount.toLocaleString("en-IN")) : ""}`);
  }

  if (page.type === "timeline") {
    const events = page.events
      .map(
        (e) => `
      <div style="display:flex;gap:14px;margin-bottom:16px;align-items:flex-start;">
        <div style="width:8px;height:8px;border-radius:50%;background:${t.accent};margin-top:8px;flex-shrink:0;"></div>
        <div>
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${t.accentDeep};font-family:system-ui,sans-serif;">${escapeHtml(formatDay(e.at))}</div>
          <div style="font-size:17px;margin-top:2px;">${escapeHtml(e.label)}</div>
        </div>
      </div>`,
      )
      .join("");
    return wrap(`
      <div style="text-align:center;font-size:28px;">Along the way</div>
      <div style="width:56px;height:1px;background:${t.accent};margin:14px auto 28px;"></div>
      ${frameImg(page.imageUrl, pageCaption(page))}
      ${events}`);
  }

  return wrap("");
}

function minimalHtml(page: BookPageModel, index: number): string {
  const t = THEMES["minimal-ink"];
  const foot = `<div style="margin-top:auto;padding-top:36px;text-align:center;font-size:11px;color:${t.muted};font-family:system-ui,sans-serif;">${index + 1}</div>`;

  const stripImg = (url?: string, caption?: string) =>
    imgTag(
      url,
      "width:100%;height:200px;object-fit:cover;display:block;border:1px solid #11111122;",
      caption,
      `margin-top:10px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;`,
    );

  if (page.type === "cover") {
    return `
    <div data-pdf-page style="width:794px;min-height:1123px;box-sizing:border-box;background:#000000;color:#ffffff;font-family:Georgia,serif;display:flex;flex-direction:column;position:relative;overflow:hidden;">
      ${
        page.imageUrl
          ? `<img src="${escapeHtml(page.imageUrl)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />
             <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.75),rgba(0,0,0,0.25),transparent);"></div>`
          : `<div style="position:absolute;inset:0;background:radial-gradient(circle at 30% 20%,#333333,transparent 55%),linear-gradient(#161616,#050505);"></div>`
      }
      <div style="position:relative;z-index:1;flex:1;display:flex;flex-direction:column;justify-content:flex-end;padding:72px;">
        <div style="font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:rgba(255,255,255,0.5);font-family:system-ui,sans-serif;">Still yours</div>
        <div style="margin-top:18px;font-size:52px;line-height:0.95;max-width:520px;">${escapeHtml(page.title)}</div>
        <p style="margin-top:20px;max-width:400px;font-size:16px;font-style:italic;line-height:1.5;color:rgba(255,255,255,0.7);">A book of messages that refused to stay ordinary.</p>
        <div style="margin-top:28px;width:64px;height:1px;background:rgba(255,255,255,0.45);"></div>
      </div>
      <div style="position:relative;z-index:1;padding:0 0 40px;text-align:center;font-size:11px;color:rgba(255,255,255,0.35);font-family:system-ui,sans-serif;">${index + 1}</div>
    </div>`;
  }

  const wrap = (inner: string) => `
    <div data-pdf-page style="width:794px;min-height:1123px;box-sizing:border-box;padding:64px 72px;background:${t.bg};color:${t.ink};font-family:Georgia,serif;display:flex;flex-direction:column;">
      ${inner}${foot}
    </div>`;

  if (page.type === "dedication") {
    return wrap(`
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;border-left:4px solid #111111;padding-left:28px;">
        <div style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;">For you</div>
        <p style="max-width:460px;font-size:30px;line-height:1.25;margin-top:20px;">${escapeHtml(page.text)}</p>
        ${stripImg(page.imageUrl, pageCaption(page))}
      </div>`);
  }

  if (page.type === "chapter") {
    const quotes = page.quotes
      .map(
        (q) => `
      <div style="margin:0 0 40px;">
        <p style="margin:0;font-size:36px;line-height:1.15;max-width:560px;">${escapeHtml(q.text)}</p>
        <div style="margin-top:14px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;">
          ${escapeHtml(q.author)} · ${escapeHtml(formatWhen(q.at))}
        </div>
      </div>`,
      )
      .join("");
    return wrap(`
      <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #111111;padding-bottom:16px;">
        <div>
          <div style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;">Hold this page</div>
          <div style="font-size:36px;line-height:1.05;margin-top:8px;max-width:480px;">${escapeHtml(page.title)}</div>
        </div>
        <div style="font-size:12px;color:${t.muted};font-family:system-ui,sans-serif;">${String(index + 1).padStart(2, "0")}</div>
      </div>
      <p style="margin:28px 0 0;font-size:14px;line-height:1.7;color:${t.soft};font-family:system-ui,sans-serif;max-width:520px;">${escapeHtml(page.narration)}</p>
      ${stripImg(page.imageUrl, pageCaption(page))}
      <div style="margin-top:40px;">${quotes}</div>`);
  }

  if (page.type === "numbers") {
    const row = (label: string, value: string) => `
      <div style="display:flex;justify-content:space-between;align-items:baseline;padding:18px 0;border-top:1px solid #11111118;">
        <div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;">${escapeHtml(label)}</div>
        <div style="font-size:28px;">${escapeHtml(value)}</div>
      </div>`;
    return wrap(`
      <div style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;">The quiet math</div>
      <div style="font-size:44px;margin-top:8px;">Numbers</div>
      ${stripImg(page.imageUrl, pageCaption(page))}
      <div style="margin-top:28px;border-bottom:1px solid #11111118;">
        ${row("Messages", page.totalMessages.toLocaleString("en-IN"))}
        ${row("Days together", String(page.daysTogether))}
        ${row("Longest silence", `${page.longestSilenceDays} days`)}
        ${row("Most active day", formatDay(page.mostActiveDay || "") || "—")}
        ${page.keyword ? row(`Times you said “${page.keyword}”`, page.keywordCount.toLocaleString("en-IN")) : ""}
      </div>`);
  }

  if (page.type === "timeline") {
    const events = page.events
      .map(
        (e, i) => `
      <div style="display:grid;grid-template-columns:90px 1fr;gap:16px;padding:14px 0;border-top:1px solid #11111118;">
        <div style="font-size:12px;color:${t.muted};font-family:system-ui,sans-serif;">${escapeHtml(formatDay(e.at))}</div>
        <div style="font-size:18px;"><span style="color:#bbbbbb;margin-right:10px;">${String(i + 1).padStart(2, "0")}</span>${escapeHtml(e.label)}</div>
      </div>`,
      )
      .join("");
    return wrap(`
      <div style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;">Chronology</div>
      <div style="font-size:44px;margin-top:8px;">Timeline</div>
      ${stripImg(page.imageUrl, pageCaption(page))}
      <div style="margin-top:24px;">${events}</div>`);
  }

  return wrap("");
}

function cuteHtml(page: BookPageModel, index: number): string {
  const t = THEMES.cute;
  const wrap = (inner: string) => `
    <div data-pdf-page style="width:794px;min-height:1123px;box-sizing:border-box;padding:48px 56px;background:${t.bg};color:${t.ink};font-family:Georgia,serif;display:flex;flex-direction:column;position:relative;overflow:hidden;">
      <div style="position:absolute;right:-40px;top:-40px;width:180px;height:180px;border-radius:50%;background:#ffd6e0cc;"></div>
      <div style="position:absolute;left:-50px;bottom:-60px;width:220px;height:220px;border-radius:50%;background:#ffe8c8e6;"></div>
      <div style="position:absolute;right:40px;top:100px;font-size:24px;color:#ff9eb580;pointer-events:none;">♡</div>
      <div style="position:absolute;left:32px;bottom:120px;font-size:20px;color:#ffb86c73;pointer-events:none;">✿</div>
      <div style="position:relative;z-index:1;flex:1;display:flex;flex-direction:column;">${inner}</div>
      <div style="position:relative;z-index:1;margin-top:auto;padding-top:28px;text-align:center;font-size:11px;color:${t.muted};font-family:system-ui,sans-serif;">${index + 1}</div>
    </div>`;

  const heartFrame = (url?: string, caption?: string) => {
    if (!url) return "";
    return `
    <figure style="position:relative;margin:24px auto;width:272px;">
      <div style="position:absolute;inset:-12px;border-radius:28px;background:#ffd6e0b3;"></div>
      <div style="position:relative;overflow:hidden;border-radius:28px;border:6px solid #ffffff;box-shadow:0 14px 36px rgba(232,120,140,0.25);">
        <img src="${escapeHtml(url)}" alt="" style="width:100%;height:272px;object-fit:cover;display:block;" />
      </div>
      ${
        caption
          ? `<figcaption style="margin-top:12px;text-align:center;font-size:13px;font-style:italic;color:${t.muted};font-family:Georgia,serif;">♡ ${escapeHtml(caption)}</figcaption>`
          : ""
      }
    </figure>`;
  };

  if (page.type === "cover") {
    return wrap(`
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
        ${
          page.imageUrl
            ? heartFrame(page.imageUrl, pageCaption(page))
            : `<div style="margin-bottom:16px;width:144px;height:144px;border-radius:50%;background:#ffd6e0;display:flex;align-items:center;justify-content:center;font-size:48px;color:${t.accent};box-shadow:inset 0 2px 8px rgba(232,120,140,0.15);">♡</div>`
        }
        <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${t.accent};font-family:system-ui,sans-serif;">Our little book</div>
        <div style="margin-top:12px;font-size:38px;color:${t.ink};">${escapeHtml(page.title)}</div>
        <p style="margin-top:12px;font-size:14px;color:${t.muted};">made of texts &amp; soft nights</p>
      </div>`);
  }

  if (page.type === "dedication") {
    return wrap(`
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <div style="max-width:420px;background:#ffffffd9;border-radius:32px;padding:32px 36px;text-align:center;box-shadow:0 10px 30px rgba(232,120,140,0.12);">
          <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${t.accent};font-family:system-ui,sans-serif;">A tiny note</div>
          <p style="margin-top:16px;font-size:20px;font-style:italic;line-height:1.55;color:${t.ink};">${escapeHtml(page.text)}</p>
        </div>
        ${heartFrame(page.imageUrl, pageCaption(page))}
      </div>`);
  }

  if (page.type === "chapter") {
    const quotes = page.quotes
      .map(
        (q, i) => `
      <div style="background:#ffffffe6;border-radius:24px;padding:16px 18px;margin-bottom:14px;box-shadow:0 8px 22px rgba(232,120,140,0.1);transform:rotate(${i % 2 === 0 ? "-0.8" : "0.8"}deg);">
        <p style="margin:0;font-size:16px;color:${t.accent};">♡</p>
        <p style="margin:8px 0 0;font-size:18px;line-height:1.45;color:${t.ink};">“${escapeHtml(q.text)}”</p>
        <div style="margin-top:8px;font-size:12px;color:${t.muted};font-family:system-ui,sans-serif;">${escapeHtml(q.author)} · ${escapeHtml(formatWhen(q.at))}</div>
      </div>`,
      )
      .join("");
    return wrap(`
      <div style="background:#ffd6e0b3;border-radius:32px;padding:20px 22px;text-align:center;">
        <div style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${t.accent};font-family:system-ui,sans-serif;">little chapter</div>
        <div style="font-size:24px;margin-top:4px;color:${t.ink};">${escapeHtml(page.title)}</div>
      </div>
      <p style="margin:22px 0 0;font-size:17px;line-height:1.65;color:${t.soft};">${escapeHtml(page.narration)}</p>
      ${heartFrame(page.imageUrl, pageCaption(page))}
      <div style="margin-top:8px;">${quotes}</div>
      ${
        page.milestone
          ? `<p style="margin-top:18px;text-align:center;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${t.accent};font-family:system-ui,sans-serif;">${escapeHtml(page.milestone)}</p>`
          : ""
      }`);
  }

  if (page.type === "numbers") {
    const card = (label: string, value: string) => `
      <div style="background:#ffffffe6;border-radius:24px;padding:18px;text-align:center;box-shadow:0 4px 12px rgba(232,120,140,0.08);">
        <div style="font-size:12px;color:${t.muted};font-family:system-ui,sans-serif;">${escapeHtml(label)}</div>
        <div style="font-size:28px;margin-top:6px;color:${t.ink};">${escapeHtml(value)}</div>
      </div>`;
    return wrap(`
      <div style="background:#ffd6e0b3;border-radius:32px;padding:16px;text-align:center;">
        <div style="font-size:24px;color:${t.ink};">Cute little counts</div>
      </div>
      ${heartFrame(page.imageUrl, pageCaption(page))}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px;">
        ${card("Messages", page.totalMessages.toLocaleString("en-IN"))}
        ${card("Days together", String(page.daysTogether))}
        ${card("Longest silence", `${page.longestSilenceDays} days`)}
        ${card("Most active day", formatDay(page.mostActiveDay || "") || "—")}
        ${page.keyword ? card(`Times you said “${page.keyword}”`, page.keywordCount.toLocaleString("en-IN")) : ""}
      </div>`);
  }

  if (page.type === "timeline") {
    const events = page.events
      .map(
        (e) => `
      <div style="display:flex;gap:12px;background:#ffffffe6;border-radius:20px;padding:12px 16px;margin-bottom:10px;box-shadow:0 4px 12px rgba(232,120,140,0.06);">
        <span style="color:${t.accent};flex-shrink:0;">♡</span>
        <div style="width:90px;flex-shrink:0;font-size:12px;color:${t.muted};font-family:system-ui,sans-serif;">${escapeHtml(formatDay(e.at))}</div>
        <div style="font-size:17px;color:${t.ink};">${escapeHtml(e.label)}</div>
      </div>`,
      )
      .join("");
    return wrap(`
      <div style="background:#ffd6e0b3;border-radius:32px;padding:16px;text-align:center;">
        <div style="font-size:24px;color:${t.ink};">Our sweet timeline</div>
      </div>
      ${heartFrame(page.imageUrl, pageCaption(page))}
      <div style="margin-top:12px;">${events}</div>`);
  }

  return wrap("");
}

function ghibliHtml(page: BookPageModel, index: number): string {
  const t = THEMES.ghibli;
  const wrap = (inner: string) => `
    <div data-pdf-page style="width:794px;min-height:1123px;box-sizing:border-box;padding:52px 56px;background:linear-gradient(180deg,#cfeaf6 0%,#e8f6ef 38%,#f6f0df 72%,#d9e8c4 100%);color:${t.ink};font-family:Georgia,serif;display:flex;flex-direction:column;position:relative;overflow:hidden;">
      <div style="position:absolute;left:-24px;top:32px;width:144px;height:80px;border-radius:100%;background:#ffffffbf;"></div>
      <div style="position:absolute;right:24px;top:80px;width:96px;height:56px;border-radius:100%;background:#ffffff99;"></div>
      <div style="position:absolute;left:33%;top:56px;width:80px;height:40px;border-radius:100%;background:#ffffff80;"></div>
      <div style="position:absolute;left:0;right:0;bottom:0;height:128px;background:linear-gradient(180deg,transparent,#b7d59a);"></div>
      <div style="position:relative;z-index:1;flex:1;display:flex;flex-direction:column;">${inner}</div>
      <div style="position:relative;z-index:1;margin-top:auto;padding-top:28px;text-align:center;font-size:11px;color:${t.accentDeep};font-family:system-ui,sans-serif;">${index + 1}</div>
    </div>`;

  const meadowFrame = (url?: string, caption?: string) => {
    if (!url) return "";
    return `
    <figure style="position:relative;margin:22px auto;width:280px;">
      <div style="position:absolute;inset:-8px;border-radius:32px;background:linear-gradient(135deg,#a8d8ea80,#b8e0c866);"></div>
      <div style="position:relative;border-radius:28px;overflow:hidden;border:4px solid #ffffff;box-shadow:0 16px 40px rgba(74,120,140,0.18);">
        <img src="${escapeHtml(url)}" alt="" style="width:100%;height:340px;object-fit:cover;display:block;" />
      </div>
      ${
        caption
          ? `<figcaption style="margin-top:12px;text-align:center;font-size:13px;font-style:italic;color:#4a6b5c;">${escapeHtml(caption)}</figcaption>`
          : ""
      }
    </figure>`;
  };

  if (page.type === "cover") {
    return wrap(`
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
        <div style="font-size:10px;letter-spacing:0.32em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;">Under soft skies</div>
        ${
          page.imageUrl
            ? meadowFrame(page.imageUrl, pageCaption(page))
            : `<div style="margin:28px 0;width:176px;height:176px;border-radius:50%;background:#ffffff8c;display:flex;align-items:center;justify-content:center;font-size:48px;color:${t.accent};box-shadow:inset 0 2px 12px rgba(90,138,154,0.1);">✿</div>`
        }
        <div style="font-size:40px;line-height:1.15;max-width:480px;">${escapeHtml(page.title)}</div>
        <p style="margin-top:16px;max-width:400px;font-size:15px;font-style:italic;line-height:1.55;color:#4a6b5c;">Like a path through grass after rain — quiet, green, still glowing.</p>
      </div>`);
  }

  if (page.type === "dedication") {
    return wrap(`
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <div style="max-width:440px;background:#ffffffb3;border-radius:32px;padding:32px;text-align:center;box-shadow:0 12px 40px rgba(90,138,154,0.12);">
          <div style="font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;">For the road</div>
          <p style="margin-top:18px;font-size:22px;font-style:italic;line-height:1.55;color:${t.ink};">${escapeHtml(page.text)}</p>
        </div>
        ${meadowFrame(page.imageUrl, pageCaption(page))}
      </div>`);
  }

  if (page.type === "chapter") {
    const quotes = page.quotes
      .map(
        (q) => `
      <blockquote style="margin:0 0 14px;background:#ffffffbf;border:1px solid #b8d4c4;border-radius:24px;padding:16px 18px;">
        <p style="margin:0;font-size:18px;line-height:1.45;color:${t.ink};">“${escapeHtml(q.text)}”</p>
        <footer style="margin-top:8px;font-size:12px;color:${t.accentDeep};font-family:system-ui,sans-serif;">
          ${escapeHtml(q.author)} · ${escapeHtml(formatWhen(q.at))}
        </footer>
      </blockquote>`,
      )
      .join("");
    return wrap(`
      <div style="background:#ffffff99;border-radius:28px;padding:18px;text-align:center;box-shadow:0 4px 16px rgba(90,138,154,0.06);">
        <div style="font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;">A quiet chapter</div>
        <div style="font-size:26px;margin-top:6px;">${escapeHtml(page.title)}</div>
      </div>
      <p style="margin:24px 0 0;font-size:17px;line-height:1.7;color:${t.soft};">${escapeHtml(page.narration)}</p>
      ${meadowFrame(page.imageUrl, pageCaption(page))}
      <div style="margin-top:8px;">${quotes}</div>
      ${
        page.milestone
          ? `<p style="margin-top:18px;text-align:center;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;">${escapeHtml(page.milestone)}</p>`
          : ""
      }`);
  }

  if (page.type === "numbers") {
    const card = (label: string, value: string) => `
      <div style="background:#ffffffbf;border-radius:24px;padding:18px;text-align:center;box-shadow:0 6px 16px rgba(90,138,154,0.08);">
        <div style="font-size:12px;color:${t.muted};font-family:system-ui,sans-serif;">${escapeHtml(label)}</div>
        <div style="font-size:28px;margin-top:6px;color:${t.ink};">${escapeHtml(value)}</div>
      </div>`;
    return wrap(`
      <div style="text-align:center;font-size:28px;color:${t.ink};">Little counts</div>
      <div style="text-align:center;font-size:14px;color:${t.accentDeep};margin-top:6px;">The soft math of your days</div>
      ${meadowFrame(page.imageUrl, pageCaption(page))}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px;">
        ${card("Messages", page.totalMessages.toLocaleString("en-IN"))}
        ${card("Days together", String(page.daysTogether))}
        ${card("Longest silence", `${page.longestSilenceDays} days`)}
        ${card("Most active day", formatDay(page.mostActiveDay || "") || "—")}
        ${page.keyword ? card(`Times you said “${page.keyword}”`, page.keywordCount.toLocaleString("en-IN")) : ""}
      </div>`);
  }

  if (page.type === "timeline") {
    const events = page.events
      .map(
        (e) => `
      <div style="display:flex;gap:12px;background:#ffffffbf;border-radius:20px;padding:12px 16px;margin-bottom:10px;box-shadow:0 4px 12px rgba(90,138,154,0.06);">
        <div style="width:90px;flex-shrink:0;font-size:12px;color:${t.muted};font-family:system-ui,sans-serif;">${escapeHtml(formatDay(e.at))}</div>
        <div style="font-size:17px;color:${t.ink};">${escapeHtml(e.label)}</div>
      </div>`,
      )
      .join("");
    return wrap(`
      <div style="text-align:center;font-size:28px;color:${t.ink};">Path through the days</div>
      ${meadowFrame(page.imageUrl, pageCaption(page))}
      <div style="margin-top:12px;">${events}</div>`);
  }

  return wrap("");
}

export async function downloadBookPdfFromPages(
  pages: BookPageModel[],
  templateId: TemplateId,
  filename = "chatstory.pdf",
  onProgress?: (done: number, total: number) => void,
) {
  if (!pages.length) throw new Error("No pages to export");

  const id = normalizeTemplateId(templateId) || "elegant-gold";

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:fixed;left:-10000px;top:0;width:794px;pointer-events:none;opacity:1;";
  document.body.appendChild(host);

  try {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const bg = theme(id).bg;

    for (let i = 0; i < pages.length; i++) {
      host.innerHTML = pageHtml(pages[i], i, id);
      const node = host.firstElementChild as HTMLElement;
      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: bg,
        useCORS: true,
        logging: false,
      });

      const img = canvas.toDataURL("image/jpeg", 0.92);
      if (i > 0) pdf.addPage();
      const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      const x = (pageWidth - w) / 2;
      const y = (pageHeight - h) / 2;
      pdf.addImage(img, "JPEG", x, y, w, h);
      onProgress?.(i + 1, pages.length);
    }

    pdf.save(filename);
  } finally {
    host.remove();
  }
}

/** @deprecated prefer downloadBookPdfFromPages */
export async function downloadBookPdf(rootId = "book-root", filename = "chatstory.pdf") {
  const root = document.getElementById(rootId);
  if (!root) throw new Error("Book root not found");

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(root, {
    scale: 2,
    backgroundColor: "#f7f3ec",
    useCORS: true,
    logging: false,
  });

  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
  const w = canvas.width * ratio;
  const h = canvas.height * ratio;
  pdf.addImage(img, "PNG", (pageWidth - w) / 2, (pageHeight - h) / 2, w, h);
  pdf.save(filename);
}
