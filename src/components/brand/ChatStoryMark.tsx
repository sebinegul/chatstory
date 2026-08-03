import Link from "next/link";

export function ChatStoryMark({
  size = "md",
  href = "/",
}: {
  size?: "sm" | "md" | "lg" | "hero";
  href?: string;
}) {
  const sizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
    hero: "text-5xl sm:text-6xl md:text-7xl",
  };

  return (
    <Link
      href={href}
      className={`font-[family-name:var(--font-space)] font-semibold tracking-tight text-[var(--ink)] ${sizes[size]}`}
    >
      Chat
      <span className="text-[var(--accent)]">Story</span>
    </Link>
  );
}
