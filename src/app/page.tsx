import { NewRunPanel } from "@/components/NewRunPanel";
import { RunsTable } from "@/components/RunsTable";
import { listRuns } from "@/lib/db";
import { loadCases } from "@/lib/load-fixtures";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const runs = listRuns();
  const cases = loadCases();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Invoice processing
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Upload a vendor invoice PDF. The process extracts fields, matches the
          purchase order, applies tolerance and duplicate rules, and returns
          Approve, Hold, or Reject with a visible reason trail.
        </p>
      </div>

      <NewRunPanel cases={cases} />

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            Run history
          </h2>
          <p className="text-xs text-slate-500">{runs.length} runs</p>
        </div>
        <RunsTable runs={runs} />
      </section>
    </div>
  );
}
