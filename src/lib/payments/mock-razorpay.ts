import { prisma } from "@/lib/db";
import type { MockCheckout, MockPaymentResult } from "./types";

export async function createMockCheckout({
  sessionId,
  amountPaise = 4900,
}: {
  sessionId: string;
  amountPaise?: number;
}): Promise<MockCheckout> {
  const order = await prisma.order.upsert({
    where: { sessionId },
    create: {
      sessionId,
      amountPaise,
      status: "mock_pending",
    },
    update: {
      amountPaise,
      status: "mock_pending",
      unlockedAt: null,
    },
  });
  return { orderId: order.id, amountPaise: order.amountPaise };
}

export async function confirmMockPayment({
  orderId,
}: {
  orderId: string;
}): Promise<MockPaymentResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: "paid", unlockedAt: new Date() },
    }),
    prisma.book.update({
      where: { sessionId: order.sessionId },
      data: { isWatermarked: false },
    }),
    prisma.session.update({
      where: { id: order.sessionId },
      data: { status: "paid" },
    }),
  ]);

  return { unlocked: true };
}
