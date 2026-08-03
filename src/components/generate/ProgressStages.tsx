"use client";

import { useEffect, useState } from "react";

const STAGES = [
  "Reading your chat...",
  "Finding your story...",
  "Writing chapters...",
  "Humanizing the voice...",
];

export function ProgressStages({ active }: { active: boolean }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setIndex((i) => (i < STAGES.length - 1 ? i + 1 : i));
    }, 2800);
    return () => clearInterval(id);
  }, [active]);

  return (
    <ul className="space-y-4">
      {STAGES.map((stage, i) => {
        const done = i < index;
        const current = i === index;
        return (
          <li
            key={stage}
            className={`flex items-center gap-3 font-[family-name:var(--font-eb-garamond)] text-xl transition ${
              current
                ? "translate-y-0 text-[var(--ink)] opacity-100"
                : done
                  ? "text-[var(--muted)] opacity-70"
                  : "text-[var(--muted)] opacity-35"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                current ? "bg-[var(--accent)]" : "bg-[var(--rule)]"
              }`}
            />
            {stage}
          </li>
        );
      })}
    </ul>
  );
}
