import { ChatStoryMark } from "@/components/brand/ChatStoryMark";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="ambient-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-2xl px-6 py-12">
        <ChatStoryMark size="md" />
        <h1 className="mt-10 font-[family-name:var(--font-space)] text-4xl font-semibold tracking-tight">
          Privacy
        </h1>
        <div className="glass-panel mt-8 space-y-5 rounded-[1.5rem] p-6 text-base leading-relaxed text-[var(--ink-soft)] sm:p-8">
          <p>
            Your WhatsApp chat is intimate. ChatStory processes it to build your
            book. We do not use your chat to train models.
          </p>
          <p>
            Uploads live only for your session. They are deleted when you download
            your book, when you press Delete now, or after 48 hours, whichever
            comes first.
          </p>
          <p>
            Payment goes through Razorpay (mocked in this preview build). We never
            see your card details.
          </p>
          <p>
            Free previews are limited to two per day from the same network to keep
            the product fair.
          </p>
        </div>
        <Link
          href="/create/upload"
          className="btn-primary mt-10 inline-flex cursor-pointer px-6 py-3 text-sm"
        >
          Back to upload
        </Link>
      </div>
    </main>
  );
}
