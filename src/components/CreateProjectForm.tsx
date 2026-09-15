"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fa } from "@/lib/i18n/fa";

export function CreateProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type: "DOCUMENT", description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || fa.errors.failed);
      router.push(`/projects/${data.project.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4"
    >
      <h2 className="text-sm font-semibold">{fa.createProject.title}</h2>
      <p className="text-xs text-zinc-500">{fa.createProject.documentOnly}</p>
      <input
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        placeholder={fa.createProject.namePlaceholder}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <textarea
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        placeholder={fa.createProject.descriptionPlaceholder}
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {busy ? fa.createProject.creating : fa.createProject.create}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
