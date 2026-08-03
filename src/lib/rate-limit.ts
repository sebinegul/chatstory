import { createHash } from "crypto";
import { prisma } from "./db";
import { hashIp } from "./ip";

function utcDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Comma-separated IPs or CIDR-less exact matches from env, plus localhost. */
function whitelistRaw(): string[] {
  const fromEnv = (process.env.RATE_LIMIT_WHITELIST || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [
    "127.0.0.1",
    "::1",
    "::ffff:127.0.0.1",
    "localhost",
    ...fromEnv,
  ];
}

export function isIpWhitelisted(ip: string): boolean {
  if (process.env.DEV_BYPASS_RATE_LIMIT === "true") return true;
  const normalized = ip.trim().toLowerCase();
  const list = whitelistRaw().map((x) => x.toLowerCase());
  if (list.includes(normalized)) return true;
  // Also allow matching the hash of whitelisted IPs (session may store hash only)
  const hashes = new Set(list.map((x) => hashIp(x)));
  if (hashes.has(normalized) || hashes.has(ip)) return true;
  return false;
}

export async function assertPreviewAllowed(ipHash: string, rawIp?: string) {
  if (rawIp && isIpWhitelisted(rawIp)) return;
  if (isIpWhitelisted(ipHash)) return;

  // Developer fingerprint: optional shared secret header hash in env
  const devToken = process.env.DEV_RATE_LIMIT_TOKEN?.trim();
  if (devToken) {
    const tokenHash = createHash("sha256").update(devToken).digest("hex");
    if (ipHash === tokenHash) return;
  }

  const dayKey = utcDayKey();
  const row = await prisma.rateLimit.findUnique({
    where: { ipHash_dayKey: { ipHash, dayKey } },
  });
  if (row && row.previews >= 2) {
    throw new Error("429 Too Many Requests: preview rate limit exceeded");
  }
}

export async function recordPreview(ipHash: string, rawIp?: string) {
  if (rawIp && isIpWhitelisted(rawIp)) return;
  if (isIpWhitelisted(ipHash)) return;

  const dayKey = utcDayKey();
  await prisma.rateLimit.upsert({
    where: { ipHash_dayKey: { ipHash, dayKey } },
    create: { ipHash, dayKey, previews: 1 },
    update: { previews: { increment: 1 } },
  });
}
