"use client";

import { useEffect, useState } from "react";
import { DecisionBadge } from "@/components/DecisionBadge";
import { StageTimeline } from "@/components/StageTimeline";
import { formatMoney } from "@/lib/format";
import type { InvoiceRun } from "@/lib/types";

export function RunLiveView({ initialRun }: { initialRun: InvoiceRun }) {
  const [run, setRun] = useState(initialRun);

  useEffect(() => {
    if (run.status === "completed" || run.status === "failed") return;

    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/runs/${run.id}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setRun(data.run);
      } catch {
        // ignore transient poll errors
      }
    };

    const id = setInterval(tick, 400);
    void tick();
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [run.id, run.status]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Live stages
        </h2>
        <div className="mt-3">
          <StageTimeline stages={run.stages} />
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Decision
              </p>
              <div className="mt-2">
                <DecisionBadge decision={run.decision} large />
              </div>
            </div>
            <p className="text-xs capitalize text-slate-500">{run.status}</p>
          </div>

          {run.reasons && run.reasons.length > 0 && (
            <ul className="mt-4 space-y-2">
              {run.reasons.map((r) => (
                <li
                  key={r.code}
                  className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  <span className="font-mono text-xs text-slate-500">
                    {r.code}
                  </span>
                  <p className="mt-0.5">{r.message}</p>
                </li>
              ))}
            </ul>
          )}

          {run.error && (
            <p className="mt-3 text-sm text-red-700">{run.error}</p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Extracted summary
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">File</dt>
              <dd className="text-right text-slate-900">{run.filename}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Vendor</dt>
              <dd className="text-right text-slate-900">
                {run.extracted?.vendorName || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Invoice #</dt>
              <dd className="text-right font-mono text-slate-900">
                {run.extracted?.invoiceNumber || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">PO #</dt>
              <dd className="text-right font-mono text-slate-900">
                {run.extracted?.poNumber || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Total</dt>
              <dd className="text-right text-slate-900">
                {formatMoney(
                  run.extracted?.total ?? null,
                  run.extracted?.currency || "USD"
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Matched PO</dt>
              <dd className="text-right text-slate-900">
                {run.matchedPo?.poNumber || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">PO remaining</dt>
              <dd className="text-right text-slate-900">
                {formatMoney(run.remainingBalance ?? null)}
              </dd>
            </div>
          </dl>
        </section>
      </aside>
    </div>
  );
}
