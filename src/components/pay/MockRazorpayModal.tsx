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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <div className="glass-panel-strong w-full max-w-md rounded-[1.5rem] p-6">
        <p className="font-[family-name:var(--font-space)] text-xs uppercase tracking-[0.2em] text-[#2dd4bf]">
          Mock Razorpay
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-space)] text-2xl font-semibold">
          Unlock your book
        </h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Pay {amountLabel} with UPI, cards, or netbanking. This is a mock
          checkout for the preview build.
        </p>
        <p className="mt-6 font-[family-name:var(--font-space)] text-4xl font-semibold text-[var(--ink)]">
          {amountLabel}
        </p>
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost flex-1 cursor-pointer px-4 py-3 text-sm"
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="btn-primary flex-1 cursor-pointer px-4 py-3 text-sm"
          >
            {busy ? "Confirming..." : "Confirm payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
