"use client";

import { useEffect, useState } from "react";
import { fa, jobStatusLabel, jobTypeLabel } from "@/lib/i18n/fa";

type Job = {
  id: string;
  type: string;
  status: string;
  progress: number;
  total: number;
  error?: string | null;
  result?: unknown;
};

export function JobProgress({
  projectId,
  onComplete,
}: {
  projectId: string;
  onComplete?: (job: Job) => void;
}) {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    let alive = true;
    async function tick() {
      const res = await fetch(`/api/projects/${projectId}/jobs`);
      const data = await res.json();
      if (!alive) return;
      setJobs(data.jobs || []);
      const running = (data.jobs || []).filter(
        (j: Job) => j.status === "RUNNING" || j.status === "PENDING",
      );
      for (const j of data.jobs || []) {
        if (j.status === "COMPLETED") onComplete?.(j);
      }
      if (running.length) setTimeout(tick, 1500);
    }
    tick();
    const id = setInterval(tick, 3000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [projectId, onComplete]);

  const active = jobs.filter(
    (j) => j.status === "RUNNING" || j.status === "PENDING" || j.status === "FAILED",
  ).slice(0, 5);

  if (active.length === 0) return null;

  return (
    <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {fa.jobs.title}
      </div>
      {active.map((j) => (
        <div key={j.id} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span>
              {jobTypeLabel(j.type)}{" "}
              <span className="text-zinc-400">· {jobStatusLabel(j.status)}</span>
            </span>
            <span className="tabular-nums text-zinc-500" dir="ltr">
              {j.progress}/{j.total || "?"}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded bg-zinc-100">
            <div
              className={`h-full ${j.status === "FAILED" ? "bg-red-500" : "bg-blue-500"}`}
              style={{
                width: `${j.total ? Math.min(100, (j.progress / j.total) * 100) : j.status === "RUNNING" ? 30 : 0}%`,
              }}
            />
          </div>
          {j.error && (
            <p className="text-xs text-red-600">{j.error}</p>
          )}
        </div>
      ))}
    </div>
  );
}
