import { NextRequest, NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/session";
import {
  confirmMockPayment,
  createMockCheckout,
} from "@/lib/payments/mock-razorpay";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, action, orderId } = body;
    if (!sessionId || !action) {
      return NextResponse.json({ error: "sessionId and action required" }, { status: 400 });
    }

    await getSessionOrThrow(sessionId);

    if (action === "create") {
      const checkout = await createMockCheckout({ sessionId, amountPaise: 4900 });
      return NextResponse.json(checkout);
    }

    if (action === "confirm") {
      if (!orderId) {
        return NextResponse.json({ error: "orderId required" }, { status: 400 });
      }
      const result = await confirmMockPayment({ orderId });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
