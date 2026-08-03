import Link from "next/link";

export function PrivacyNotice({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 text-sm leading-relaxed text-[var(--ink-soft)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 accent-[var(--accent)]"
      />
      <span>
        I understand my chat is processed to build this book, never used for
        training, and deleted after download or within 48 hours.{" "}
        <Link
          href="/privacy"
          className="underline decoration-[var(--accent)] underline-offset-4"
        >
          Read the privacy policy
        </Link>
        .
      </span>
    </label>
  );
}
