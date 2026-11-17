"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CaseMeta } from "@/lib/load-fixtures";

export function NewRunPanel({ cases }: { cases: CaseMeta[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startFixture(fixtureId: string) {
    setBusy(fixtureId);
    setError(null);
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixtureId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start run");
      router.push(`/runs/${data.run.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start run");
      setBusy(null);
    }
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setBusy("upload");
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/runs", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start run");
      router.push(`/runs/${data.run.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start run");
      setBusy(null);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">New run</h2>
      <p className="mt-1 text-sm text-slate-600">
        Upload an invoice PDF or run a prepared test case.
      </p>

      <div className="mt-4">
        <label className="block text-sm font-medium text-slate-700">
          Upload PDF
        </label>
        <input
          type="file"
          accept="application/pdf,.pdf"
          className="mt-1 block w-full text-sm text-slate-700 file:mr-3 file:rounded file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
          disabled={busy !== null}
          onChange={(e) => onUpload(e.target.files?.[0] || null)}
        />
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-slate-700">Test cases</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {cases.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={busy !== null}
              onClick={() => startFixture(c.id)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-slate-300 hover:bg-white disabled:opacity-60"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {c.id}
                </span>
                <span className="text-xs text-slate-500">
                  → {c.expectedDecision}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {busy === c.id ? "Starting…" : c.label}
              </p>
              <p className="mt-0.5 text-xs text-slate-600">{c.scenario}</p>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
