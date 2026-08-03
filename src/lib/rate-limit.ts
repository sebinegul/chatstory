import { prisma } from "./db";

function utcDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export async function assertPreviewAllowed(ipHash: string) {
  const dayKey = utcDayKey();
  const row = await prisma.rateLimit.findUnique({
    where: { ipHash_dayKey: { ipHash, dayKey } },
  });
  if (row && row.previews >= 2) {
    throw new Error("429 Too Many Requests: preview rate limit exceeded");
  }
}

export async function recordPreview(ipHash: string) {
  const dayKey = utcDayKey();
  await prisma.rateLimit.upsert({
    where: { ipHash_dayKey: { ipHash, dayKey } },
    create: { ipHash, dayKey, previews: 1 },
    update: { previews: { increment: 1 } },
  });
}
