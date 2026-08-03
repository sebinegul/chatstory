import { ChatStoryMark } from "@/components/brand/ChatStoryMark";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <ChatStoryMark size="md" />
      <h1 className="mt-10 font-[family-name:var(--font-cormorant)] text-4xl">
        Privacy
      </h1>
      <div className="mt-8 space-y-5 font-[family-name:var(--font-eb-garamond)] text-lg leading-relaxed text-[var(--ink-soft)]">
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
        className="mt-10 inline-block text-sm text-[var(--gold-deep)]"
      >
        Back to upload
      </Link>
    </main>
  );
}
