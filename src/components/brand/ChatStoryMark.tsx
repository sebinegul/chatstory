import Link from "next/link";

export function ChatStoryMark({
  size = "md",
  href = "/",
}: {
  size?: "sm" | "md" | "lg" | "hero";
  href?: string;
}) {
  const sizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
    hero: "text-6xl sm:text-7xl md:text-8xl",
  };

  return (
    <Link
      href={href}
      className={`font-[family-name:var(--font-cormorant)] font-semibold tracking-tight text-[var(--ink)] ${sizes[size]}`}
    >
      ChatStory
    </Link>
  );
}
