import Link from "next/link";
import { DecisionBadge } from "@/components/DecisionBadge";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { InvoiceRun } from "@/lib/types";

export function RunsTable({ runs }: { runs: InvoiceRun[] }) {
  if (runs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
        No runs yet. Start a test case or upload an invoice.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Vendor</th>
            <th className="px-4 py-3">Invoice</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Decision</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {runs.map((run) => (
            <tr key={run.id} className="hover:bg-slate-50/80">
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {formatDateTime(run.createdAt)}
              </td>
              <td className="px-4 py-3 text-slate-900">
                {run.extracted?.vendorName || "—"}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-700">
                {run.extracted?.invoiceNumber || "—"}
              </td>
              <td className="px-4 py-3 text-slate-700">
                {formatMoney(
                  run.extracted?.total ?? null,
                  run.extracted?.currency || "USD"
                )}
              </td>
              <td className="px-4 py-3 capitalize text-slate-600">
                {run.status}
              </td>
              <td className="px-4 py-3">
                <DecisionBadge decision={run.decision} />
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/runs/${run.id}`}
                  className="font-medium text-slate-900 underline-offset-2 hover:underline"
                >
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
