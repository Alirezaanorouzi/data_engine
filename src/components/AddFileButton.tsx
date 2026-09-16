"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fa } from "@/lib/i18n/fa";

type Props = {
  projectId: string;
  /** Compact header-style button (default) vs slightly larger CTA */
  size?: "sm" | "md";
  onUploaded?: () => void;
};

export function AddFileButton({
  projectId,
  size = "sm",
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    setHint(null);
    try {
      const form = new FormData();
      for (const f of Array.from(files)) form.append("files", f);
      const res = await fetch(`/api/projects/${projectId}/upload`, {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : fa.upload.uploadFailed,
        );
      }
      const accepted = Number(data.accepted ?? 0);
      const duplicates = Number(data.duplicates ?? 0);
      if (accepted > 0) {
        setHint(`${fa.upload.accepted}: ${accepted}`);
      } else if (duplicates > 0) {
        setHint(fa.upload.duplicateHint);
      }
      onUploaded?.();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const pad = size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm";

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={`inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white font-medium text-zinc-800 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-50 ${pad}`}
      >
        <span aria-hidden className="text-base leading-none text-zinc-500">
          +
        </span>
        {busy ? fa.upload.uploading : fa.project.addFile}
      </button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        accept="application/pdf,.pdf"
        disabled={busy}
        onChange={(e) => onFiles(e.target.files)}
      />
      {error && (
        <p className="max-w-[16rem] text-xs text-red-600">{error}</p>
      )}
      {hint && !error && (
        <p className="max-w-[16rem] text-xs text-emerald-700">{hint}</p>
      )}
    </div>
  );
}
