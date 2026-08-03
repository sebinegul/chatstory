"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepShell } from "@/components/flow/StepShell";
import { Dropzone } from "@/components/upload/Dropzone";
import { PrivacyNotice } from "@/components/privacy/PrivacyNotice";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    if (!file) {
      setError("Choose a WhatsApp .txt export first.");
      return;
    }
    if (!accepted) {
      setError("Please accept the privacy notice.");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("privacyAccepted", "true");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      sessionStorage.setItem("chatstorySessionId", data.sessionId);
      router.push("/create/stats");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <StepShell step={1} title="Upload your chat">
      <Dropzone onFile={setFile} disabled={busy} />
      <div className="mt-6">
        <PrivacyNotice checked={accepted} onChange={setAccepted} />
      </div>
      {error && <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="mt-8 btn-primary cursor-pointer px-6 py-3 text-sm disabled:opacity-60"
      >
        {busy ? "Reading..." : "Continue"}
      </button>
    </StepShell>
  );
}
