import type { BookPageModel } from "@/lib/ai/types";
import type { TemplateId } from "@/lib/templates/registry";
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
  pastel: {
    bg: "#faf3f1",
    ink: "#4a3030",
    soft: "#6b4a4a",
    muted: "#9a6b6b",
    accent: "#d4a5a5",
    accentDeep: "#9a6b6b",
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
    <figure style="margin:24px 0;${caption ? "" : ""}">
      <img src="${safe}" alt="" style="${style}" />
      ${
        caption
          ? `<figcaption style="${captionStyle || `margin-top:10px;text-align:center;font-size:11px;color:#78716c;`}">${escapeHtml(caption)}</figcaption>`
          : ""
      }
    </figure>`;
}

function pageHtml(
  page: BookPageModel,
  index: number,
  templateId: TemplateId,
): string {
  if (templateId === "minimal-ink") return minimalHtml(page, index);
  if (templateId === "pastel") return pastelHtml(page, index);
  if (templateId === "ghibli") return ghibliHtml(page, index);
  return elegantHtml(page, index);
}

function elegantHtml(page: BookPageModel, index: number): string {
  const t = THEMES["elegant-gold"];
  const wrap = (inner: string) => `
    <div data-pdf-page style="
      width:794px;min-height:1123px;box-sizing:border-box;padding:56px 64px;
      background:${t.bg};color:${t.ink};font-family:Georgia,'Times New Roman',serif;
      display:flex;flex-direction:column;position:relative;
    ">
      <div style="position:absolute;inset:18px;border:1px solid ${t.accent}40;pointer-events:none;"></div>
      <div style="position:absolute;inset:28px;border:1px solid ${t.accent}25;pointer-events:none;"></div>
      <div style="position:relative;z-index:1;flex:1;display:flex;flex-direction:column;">${inner}</div>
      <div style="position:relative;z-index:1;margin-top:auto;padding-top:36px;text-align:center;font-size:11px;color:${t.muted};font-family:system-ui,sans-serif;">${index + 1}</div>
    </div>`;

  if (page.type === "cover") {
    return wrap(`
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
        <div style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:${t.accentDeep};font-family:system-ui,sans-serif;">ChatStory</div>
        ${
          page.imageUrl
            ? imgTag(
                page.imageUrl,
                "width:220px;height:280px;object-fit:cover;display:block;border:1px solid " +
                  t.accent +
                  "66;padding:8px;background:" +
                  t.bg +
                  ";",
              )
            : `<div style="margin:28px 0;width:120px;height:160px;border:1px solid ${t.accent}66;display:flex;align-items:center;justify-content:center;font-size:36px;color:${t.accent};">❦</div>`
        }
        <div style="font-size:40px;line-height:1.15;margin-top:8px;">${escapeHtml(page.title)}</div>
        <div style="margin-top:22px;display:flex;align-items:center;gap:10px;color:${t.accent};">
          <span style="width:40px;height:1px;background:${t.accent};display:inline-block;"></span>
          <span>◆</span>
          <span style="width:40px;height:1px;background:${t.accent};display:inline-block;"></span>
        </div>
      </div>`);
  }

  if (page.type === "dedication") {
    return wrap(`
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
        <div style="font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${t.accentDeep};font-family:system-ui,sans-serif;">Dedication</div>
        <p style="max-width:420px;font-size:22px;font-style:italic;line-height:1.6;color:${t.soft};margin-top:28px;">${escapeHtml(page.text)}</p>
        ${imgTag(page.imageUrl, "width:240px;height:300px;object-fit:cover;display:block;margin:0 auto;border:1px solid " + t.accent + "66;padding:8px;", page.imageCaption)}
      </div>`);
  }

  if (page.type === "chapter") {
    const quotes = page.quotes
      .map(
        (q) => `
      <blockquote style="margin:0 0 22px;padding-left:16px;border-left:2px solid ${t.accent};text-align:left;">
        <p style="margin:0;font-size:20px;line-height:1.45;">“${escapeHtml(q.text)}”</p>
        <footer style="margin-top:8px;font-size:12px;color:${t.muted};font-family:system-ui,sans-serif;">
          ${escapeHtml(q.author)} · ${escapeHtml(formatWhen(q.at))}
        </footer>
      </blockquote>`,
      )
      .join("");
    return wrap(`
      <div style="text-align:center;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:${t.accentDeep};font-family:system-ui,sans-serif;">Chapter</div>
      <div style="text-align:center;font-size:28px;margin-top:10px;">${escapeHtml(page.title)}</div>
      <div style="width:56px;height:1px;background:${t.accent};margin:14px auto 0;"></div>
      <p style="margin:28px 0 0;font-size:17px;line-height:1.7;color:${t.soft};text-align:center;">${escapeHtml(page.narration)}</p>
      ${imgTag(page.imageUrl, "width:280px;height:200px;object-fit:cover;display:block;margin:0 auto;border:1px solid " + t.accent + "66;padding:8px;", page.imageCaption)}
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
        <div style="font-size:12px;color:${t.muted};font-family:system-ui,sans-serif;">${escapeHtml(label)}</div>
        <div style="font-size:28px;margin-top:4px;">${escapeHtml(value)}</div>
      </div>`;
    return wrap(`
      <div style="text-align:center;font-size:28px;">The Numbers</div>
      <div style="width:56px;height:1px;background:${t.accent};margin:14px auto 28px;"></div>
      ${imgTag(page.imageUrl, "width:280px;height:180px;object-fit:cover;display:block;margin:0 auto 24px;border:1px solid " + t.accent + "66;padding:8px;", page.imageCaption)}
      ${row("Messages", page.totalMessages.toLocaleString("en-IN"))}
      ${row("Days together", String(page.daysTogether))}
      ${row("Longest silence", `${page.longestSilenceDays} days`)}
      ${row("Most active day", formatDay(page.mostActiveDay || "") || "—")}
      ${page.keyword ? row(`Times you said “${page.keyword}”`, page.keywordCount.toLocaleString("en-IN")) : ""}`);
  }

  if (page.type === "timeline") {
    const events = page.events
      .map(
        (e) => `
      <div style="display:flex;gap:14px;margin-bottom:16px;align-items:flex-start;">
        <div style="width:8px;height:8px;border-radius:50%;background:${t.accent};margin-top:8px;flex-shrink:0;"></div>
        <div>
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${t.accentDeep};font-family:system-ui,sans-serif;">${escapeHtml(formatDay(e.at))}</div>
          <div style="font-size:17px;margin-top:2px;">${escapeHtml(e.label)}</div>
        </div>
      </div>`,
      )
      .join("");
    return wrap(`
      <div style="text-align:center;font-size:28px;">Timeline</div>
      <div style="width:56px;height:1px;background:${t.accent};margin:14px auto 28px;"></div>
      ${imgTag(page.imageUrl, "width:280px;height:160px;object-fit:cover;display:block;margin:0 auto 24px;border:1px solid " + t.accent + "66;padding:8px;", page.imageCaption)}
      ${events}`);
  }

  return wrap("");
}

function minimalHtml(page: BookPageModel, index: number): string {
  const t = THEMES["minimal-ink"];
  const foot = `<div style="margin-top:auto;padding-top:36px;text-align:center;font-size:11px;color:${t.muted};font-family:system-ui,sans-serif;">${index + 1}</div>`;

  if (page.type === "cover") {
    return `
    <div data-pdf-page style="width:794px;min-height:1123px;box-sizing:border-box;background:#000;color:#fff;font-family:Georgia,serif;display:flex;flex-direction:column;position:relative;overflow:hidden;">
      ${
        page.imageUrl
          ? `<img src="${escapeHtml(page.imageUrl)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />
             <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.75),rgba(0,0,0,0.15),transparent);"></div>`
          : `<div style="position:absolute;inset:0;background:radial-gradient(circle at 30% 20%,#333,transparent 55%),linear-gradient(#111,#000);"></div>`
      }
      <div style="position:relative;z-index:1;flex:1;display:flex;flex-direction:column;justify-content:flex-end;padding:72px;">
        <div style="font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:rgba(255,255,255,0.55);font-family:system-ui,sans-serif;">ChatStory</div>
        <div style="margin-top:18px;font-size:52px;line-height:0.95;max-width:520px;">${escapeHtml(page.title)}</div>
        <div style="margin-top:28px;width:64px;height:1px;background:rgba(255,255,255,0.5);"></div>
      </div>
      <div style="position:relative;z-index:1;padding:0 0 40px;text-align:center;font-size:11px;color:rgba(255,255,255,0.4);font-family:system-ui,sans-serif;">${index + 1}</div>
    </div>`;
  }

  const wrap = (inner: string) => `
    <div data-pdf-page style="width:794px;min-height:1123px;box-sizing:border-box;padding:64px 72px;background:${t.bg};color:${t.ink};font-family:Georgia,serif;display:flex;flex-direction:column;">
      ${inner}${foot}
    </div>`;

  if (page.type === "dedication") {
    return wrap(`
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;border-left:4px solid #111;padding-left:28px;">
        <div style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;">For you</div>
        <p style="max-width:460px;font-size:30px;line-height:1.25;margin-top:20px;">${escapeHtml(page.text)}</p>
        ${imgTag(page.imageUrl, "width:100%;max-height:220px;object-fit:cover;display:block;border:1px solid #11111122;", page.imageCaption, `margin-top:10px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;`)}
      </div>`);
  }

  if (page.type === "chapter") {
    const quotes = page.quotes
      .map(
        (q) => `
      <div style="margin:0 0 36px;">
        <p style="margin:0;font-size:34px;line-height:1.2;max-width:560px;">${escapeHtml(q.text)}</p>
        <div style="margin-top:12px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;">
          ${escapeHtml(q.author)} · ${escapeHtml(formatWhen(q.at))}
        </div>
      </div>`,
      )
      .join("");
    return wrap(`
      <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #111;padding-bottom:16px;">
        <div>
          <div style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;">Chapter</div>
          <div style="font-size:36px;line-height:1.05;margin-top:8px;max-width:480px;">${escapeHtml(page.title)}</div>
        </div>
        <div style="font-size:12px;color:${t.muted};font-family:system-ui,sans-serif;">${String(index + 1).padStart(2, "0")}</div>
      </div>
      <p style="margin:28px 0 0;font-size:14px;line-height:1.7;color:${t.soft};font-family:system-ui,sans-serif;max-width:520px;">${escapeHtml(page.narration)}</p>
      ${imgTag(page.imageUrl, "width:100%;height:200px;object-fit:cover;display:block;border:1px solid #11111122;", page.imageCaption, `margin-top:10px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;`)}
      <div style="margin-top:36px;">${quotes}</div>`);
  }

  if (page.type === "numbers") {
    const row = (label: string, value: string) => `
      <div style="display:flex;justify-content:space-between;align-items:baseline;padding:18px 0;border-top:1px solid #11111118;">
        <div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;">${escapeHtml(label)}</div>
        <div style="font-size:28px;">${escapeHtml(value)}</div>
      </div>`;
    return wrap(`
      <div style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;">Index</div>
      <div style="font-size:44px;margin-top:8px;">Numbers</div>
      ${imgTag(page.imageUrl, "width:100%;height:180px;object-fit:cover;display:block;border:1px solid #11111122;", page.imageCaption)}
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
        <div style="font-size:18px;"><span style="color:#bbb;margin-right:10px;">${String(i + 1).padStart(2, "0")}</span>${escapeHtml(e.label)}</div>
      </div>`,
      )
      .join("");
    return wrap(`
      <div style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;">Chronology</div>
      <div style="font-size:44px;margin-top:8px;">Timeline</div>
      ${imgTag(page.imageUrl, "width:100%;height:160px;object-fit:cover;display:block;border:1px solid #11111122;", page.imageCaption)}
      <div style="margin-top:24px;">${events}</div>`);
  }

  return wrap("");
}

function pastelHtml(page: BookPageModel, index: number): string {
  const t = THEMES.pastel;
  const wrap = (inner: string) => `
    <div data-pdf-page style="width:794px;min-height:1123px;box-sizing:border-box;padding:48px 56px;background:${t.bg};color:${t.ink};font-family:Georgia,serif;display:flex;flex-direction:column;position:relative;overflow:hidden;">
      <div style="position:absolute;right:-40px;top:-40px;width:180px;height:180px;border-radius:50%;background:#f3e4e2;"></div>
      <div style="position:absolute;left:-50px;bottom:-60px;width:220px;height:220px;border-radius:50%;background:#efe0dc;"></div>
      <div style="position:relative;z-index:1;flex:1;display:flex;flex-direction:column;">${inner}</div>
      <div style="position:relative;z-index:1;margin-top:auto;padding-top:28px;text-align:center;font-size:11px;color:${t.muted};font-family:system-ui,sans-serif;">${index + 1}</div>
    </div>`;

  const polaroid = (url?: string, caption?: string) =>
    url
      ? `
    <div style="margin:24px auto;width:260px;background:#fff;padding:12px 12px 28px;box-shadow:0 12px 30px rgba(74,48,48,0.12);transform:rotate(-2deg);">
      <img src="${escapeHtml(url)}" alt="" style="width:100%;height:300px;object-fit:cover;display:block;" />
      ${caption ? `<div style="margin-top:12px;text-align:center;font-size:13px;font-style:italic;color:${t.soft};">${escapeHtml(caption)}</div>` : ""}
    </div>`
      : "";

  if (page.type === "cover") {
    return wrap(`
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
        ${
          page.imageUrl
            ? polaroid(page.imageUrl)
            : `<div style="margin-bottom:16px;transform:rotate(-3deg);background:#f3e4e2;border-radius:24px;padding:48px 56px;font-size:48px;color:#c48b8b;">♡</div>`
        }
        <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;">ChatStory</div>
        <div style="margin-top:12px;font-size:38px;">${escapeHtml(page.title)}</div>
      </div>`);
  }

  if (page.type === "dedication") {
    return wrap(`
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <div style="max-width:420px;background:rgba(255,255,255,0.82);border-radius:24px;padding:28px 32px;text-align:center;box-shadow:0 8px 24px rgba(74,48,48,0.06);">
          <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;">A note</div>
          <p style="margin-top:14px;font-size:20px;font-style:italic;line-height:1.55;">${escapeHtml(page.text)}</p>
        </div>
        ${polaroid(page.imageUrl, page.imageCaption)}
      </div>`);
  }

  if (page.type === "chapter") {
    const quotes = page.quotes
      .map(
        (q, i) => `
      <div style="background:rgba(255,255,255,0.88);border-radius:18px;padding:16px 18px;margin-bottom:14px;box-shadow:0 6px 18px rgba(74,48,48,0.05);transform:rotate(${i % 2 === 0 ? "-0.5" : "0.6"}deg);">
        <p style="margin:0;font-size:18px;line-height:1.45;">“${escapeHtml(q.text)}”</p>
        <div style="margin-top:8px;font-size:12px;color:${t.muted};font-family:system-ui,sans-serif;">${escapeHtml(q.author)} · ${escapeHtml(formatWhen(q.at))}</div>
      </div>`,
      )
      .join("");
    return wrap(`
      <div style="background:#f3e4e2;border-radius:24px;padding:18px 20px;text-align:center;">
        <div style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;">This chapter</div>
        <div style="font-size:24px;margin-top:4px;">${escapeHtml(page.title)}</div>
      </div>
      <p style="margin:22px 0 0;font-size:17px;line-height:1.65;color:${t.soft};">${escapeHtml(page.narration)}</p>
      ${polaroid(page.imageUrl, page.imageCaption)}
      <div style="margin-top:8px;">${quotes}</div>
      ${
        page.milestone
          ? `<p style="margin-top:18px;text-align:center;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;">${escapeHtml(page.milestone)}</p>`
          : ""
      }`);
  }

  if (page.type === "numbers") {
    const card = (label: string, value: string) => `
      <div style="background:rgba(255,255,255,0.78);border-radius:20px;padding:18px;text-align:center;box-shadow:0 6px 16px rgba(74,48,48,0.05);">
        <div style="font-size:12px;color:${t.muted};font-family:system-ui,sans-serif;">${escapeHtml(label)}</div>
        <div style="font-size:28px;margin-top:6px;">${escapeHtml(value)}</div>
      </div>`;
    return wrap(`
      <div style="background:#f3e4e2;border-radius:24px;padding:16px;text-align:center;">
        <div style="font-size:24px;">Little numbers</div>
      </div>
      ${polaroid(page.imageUrl, page.imageCaption)}
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
      <div style="display:flex;gap:12px;background:rgba(255,255,255,0.82);border-radius:16px;padding:12px 16px;margin-bottom:10px;box-shadow:0 4px 12px rgba(74,48,48,0.04);">
        <div style="width:90px;flex-shrink:0;font-size:12px;color:${t.muted};font-family:system-ui,sans-serif;">${escapeHtml(formatDay(e.at))}</div>
        <div style="font-size:17px;">${escapeHtml(e.label)}</div>
      </div>`,
      )
      .join("");
    return wrap(`
      <div style="background:#f3e4e2;border-radius:24px;padding:16px;text-align:center;">
        <div style="font-size:24px;">Our timeline</div>
      </div>
      ${polaroid(page.imageUrl, page.imageCaption)}
      <div style="margin-top:12px;">${events}</div>`);
  }

  return wrap("");
}

function ghibliHtml(page: BookPageModel, index: number): string {
  const t = THEMES.ghibli;
  const wrap = (inner: string) => `
    <div data-pdf-page style="width:794px;min-height:1123px;box-sizing:border-box;padding:52px 56px;background:linear-gradient(180deg,#d4eef8 0%,#eef8f2 42%,#f7f3e8 100%);color:${t.ink};font-family:Georgia,serif;display:flex;flex-direction:column;position:relative;overflow:hidden;">
      <div style="position:absolute;left:-20px;top:40px;width:160px;height:90px;border-radius:100%;background:rgba(255,255,255,0.7);"></div>
      <div style="position:absolute;right:30px;top:90px;width:110px;height:60px;border-radius:100%;background:rgba(255,255,255,0.55);"></div>
      <div style="position:absolute;left:0;right:0;bottom:0;height:110px;background:linear-gradient(180deg,transparent,#c5e0b8);"></div>
      <div style="position:relative;z-index:1;flex:1;display:flex;flex-direction:column;">${inner}</div>
      <div style="position:relative;z-index:1;margin-top:auto;padding-top:28px;text-align:center;font-size:11px;color:${t.muted};font-family:system-ui,sans-serif;">${index + 1}</div>
    </div>`;

  const meadow = (url?: string, caption?: string) =>
    url
      ? `
    <div style="margin:22px auto;width:280px;position:relative;">
      <div style="border-radius:28px;overflow:hidden;border:6px solid #fff;box-shadow:0 16px 40px rgba(74,120,140,0.18);">
        <img src="${escapeHtml(url)}" alt="" style="width:100%;height:340px;object-fit:cover;display:block;" />
      </div>
      ${caption ? `<div style="margin-top:12px;text-align:center;font-size:13px;font-style:italic;color:${t.soft};">${escapeHtml(caption)}</div>` : ""}
    </div>`
      : "";

  if (page.type === "cover") {
    return wrap(`
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
        <div style="font-size:10px;letter-spacing:0.32em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;">ChatStory · Meadow</div>
        ${
          page.imageUrl
            ? meadow(page.imageUrl)
            : `<div style="margin:28px 0;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.5);display:flex;align-items:center;justify-content:center;font-size:48px;color:${t.accent};">✿</div>`
        }
        <div style="font-size:40px;line-height:1.15;max-width:480px;">${escapeHtml(page.title)}</div>
        <div style="margin-top:14px;font-size:14px;color:${t.accentDeep};">A story under soft skies</div>
      </div>`);
  }

  if (page.type === "dedication") {
    return wrap(`
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <div style="max-width:440px;background:rgba(255,255,255,0.65);border-radius:32px;padding:32px;text-align:center;box-shadow:0 12px 40px rgba(90,138,154,0.12);">
          <div style="font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;">For the road</div>
          <p style="margin-top:18px;font-size:22px;font-style:italic;line-height:1.55;">${escapeHtml(page.text)}</p>
        </div>
        ${meadow(page.imageUrl, page.imageCaption)}
      </div>`);
  }

  if (page.type === "chapter") {
    const quotes = page.quotes
      .map(
        (q) => `
      <blockquote style="margin:0 0 14px;background:rgba(255,255,255,0.7);border:1px solid #b8d4c4;border-radius:22px;padding:16px 18px;">
        <p style="margin:0;font-size:18px;line-height:1.45;">“${escapeHtml(q.text)}”</p>
        <footer style="margin-top:8px;font-size:12px;color:${t.accentDeep};font-family:system-ui,sans-serif;">
          ${escapeHtml(q.author)} · ${escapeHtml(formatWhen(q.at))}
        </footer>
      </blockquote>`,
      )
      .join("");
    return wrap(`
      <div style="background:rgba(255,255,255,0.55);border-radius:28px;padding:18px;text-align:center;">
        <div style="font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;">A quiet chapter</div>
        <div style="font-size:26px;margin-top:6px;">${escapeHtml(page.title)}</div>
      </div>
      <p style="margin:24px 0 0;font-size:17px;line-height:1.7;color:${t.soft};">${escapeHtml(page.narration)}</p>
      ${meadow(page.imageUrl, page.imageCaption)}
      <div style="margin-top:8px;">${quotes}</div>
      ${
        page.milestone
          ? `<p style="margin-top:18px;text-align:center;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${t.muted};font-family:system-ui,sans-serif;">${escapeHtml(page.milestone)}</p>`
          : ""
      }`);
  }

  if (page.type === "numbers") {
    const card = (label: string, value: string) => `
      <div style="background:rgba(255,255,255,0.72);border-radius:22px;padding:18px;text-align:center;box-shadow:0 6px 16px rgba(90,138,154,0.08);">
        <div style="font-size:12px;color:${t.muted};font-family:system-ui,sans-serif;">${escapeHtml(label)}</div>
        <div style="font-size:28px;margin-top:6px;">${escapeHtml(value)}</div>
      </div>`;
    return wrap(`
      <div style="text-align:center;font-size:28px;">Little counts</div>
      <div style="text-align:center;font-size:14px;color:${t.accentDeep};margin-top:6px;">The soft math of your days</div>
      ${meadow(page.imageUrl, page.imageCaption)}
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
      <div style="display:flex;gap:12px;background:rgba(255,255,255,0.72);border-radius:18px;padding:12px 16px;margin-bottom:10px;">
        <div style="width:90px;flex-shrink:0;font-size:12px;color:${t.muted};font-family:system-ui,sans-serif;">${escapeHtml(formatDay(e.at))}</div>
        <div style="font-size:17px;">${escapeHtml(e.label)}</div>
      </div>`,
      )
      .join("");
    return wrap(`
      <div style="text-align:center;font-size:28px;">Path through the days</div>
      ${meadow(page.imageUrl, page.imageCaption)}
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
    const bg = theme(templateId).bg;

    for (let i = 0; i < pages.length; i++) {
      host.innerHTML = pageHtml(pages[i], i, templateId);
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
