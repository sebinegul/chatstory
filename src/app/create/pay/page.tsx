"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepShell } from "@/components/flow/StepShell";
import { MockRazorpayModal } from "@/components/pay/MockRazorpayModal";

export default function PayPage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const sessionId = sessionStorage.getItem("chatstorySessionId");
      if (!sessionId) {
        router.replace("/create/upload");
        return;
      }
      const create = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action: "create" }),
      });
      const created = await create.json();
      if (!create.ok) throw new Error(created.error || "Checkout failed");

      const confirm = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          action: "confirm",
          orderId: created.orderId,
        }),
      });
      const confirmed = await confirm.json();
      if (!confirm.ok) throw new Error(confirmed.error || "Payment failed");
      if (email) sessionStorage.setItem("chatstoryEmail", email);
      router.push("/create/download");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <StepShell step={6} title="Unlock for Rs.49">
      <p className="font-[family-name:var(--font-eb-garamond)] text-lg text-[var(--ink-soft)]">
        Your watermarked preview is ready. Pay Rs.49 to download the full PDF.
        Regenerations in preview stay free.
      </p>
      <label className="mt-6 block text-sm">
        <span className="text-[var(--muted)]">Email (optional)</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-sm border border-[var(--rule)] bg-transparent px-3 py-2"
          placeholder="backup copy later"
        />
      </label>
      {error && <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-8 rounded-sm bg-[var(--gold-deep)] px-6 py-3 text-sm text-[var(--paper)]"
      >
        Pay Rs.49
      </button>
      <MockRazorpayModal
        open={open}
        busy={busy}
        onClose={() => setOpen(false)}
        onConfirm={() => void pay()}
      />
    </StepShell>
  );
}
