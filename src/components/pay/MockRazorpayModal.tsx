"use client";

export function MockRazorpayModal({
  open,
  amountLabel = "Rs.49",
  onClose,
  onConfirm,
  busy,
}: {
  open: boolean;
  amountLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(28,25,23,0.45)] p-4 sm:items-center">
      <div className="w-full max-w-md rounded-sm bg-[var(--paper)] p-6 shadow-xl">
        <p className="font-[family-name:var(--font-jost)] text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Mock Razorpay
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-cormorant)] text-3xl">
          Unlock your book
        </h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Pay {amountLabel} with UPI, cards, or netbanking. This is a mock
          checkout for the preview build.
        </p>
        <p className="mt-6 font-[family-name:var(--font-cormorant)] text-4xl text-[var(--ink)]">
          {amountLabel}
        </p>
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-sm border border-[var(--rule)] px-4 py-3 text-sm"
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-sm bg-[var(--gold-deep)] px-4 py-3 text-sm text-[var(--paper)]"
          >
            {busy ? "Confirming..." : "Confirm payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
