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
      <div className="surface-panel w-full max-w-md p-6">
        <p className="text-sm font-medium text-[var(--accent)]">Mock Razorpay</p>
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
