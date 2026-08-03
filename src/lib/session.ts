import { prisma } from "./db";

const SESSION_TTL_MS = 48 * 60 * 60 * 1000;

export async function createSession({
  ipHash,
  privacyAccepted,
}: {
  ipHash?: string;
  privacyAccepted: boolean;
}) {
  const now = new Date();
  return prisma.session.create({
    data: {
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
      clientIpHash: ipHash,
      privacyAcceptedAt: privacyAccepted ? now : null,
    },
  });
}

export async function getSessionOrThrow(id: string) {
  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) {
    throw new Error("Session not found");
  }
  if (session.status === "deleted") {
    throw new Error("Session deleted");
  }
  if (session.expiresAt.getTime() <= Date.now()) {
    throw new Error("Session expired");
  }
  return session;
}
