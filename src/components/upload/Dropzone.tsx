"use client";

import { useCallback, useState } from "react";

export function Dropzone({
  onFile,
  disabled,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [name, setName] = useState<string | null>(null);

  const take = useCallback(
    (file: File | undefined) => {
      if (!file || disabled) return;
      setName(file.name);
      onFile(file);
    },
    [disabled, onFile],
  );

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        take(e.dataTransfer.files?.[0]);
      }}
      className={`flex min-h-[11rem] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-14 text-center transition-[border-color,background-color] duration-160 ${
        dragging
          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
          : "border-[var(--rule)] bg-[var(--surface)]"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <input
        type="file"
        accept=".txt,text/plain"
        className="hidden"
        disabled={disabled}
        onChange={(e) => take(e.target.files?.[0])}
      />
      <p className="font-[family-name:var(--font-space)] text-xl font-medium text-[var(--ink)]">
        {name ? name : "Drop your WhatsApp .txt here"}
      </p>
      <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">
        Export chat without media. Max 10 MB.
      </p>
    </label>
  );
}
