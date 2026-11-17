import Link from "next/link";
import { notFound } from "next/navigation";
import { RunLiveView } from "@/components/RunLiveView";
import { getRun } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = getRun(id);
  if (!run) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Run detail
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            {run.fixtureId ? `${run.fixtureId} · ${run.filename}` : run.filename}
          </h1>
          <p className="mt-1 font-mono text-xs text-slate-500">{run.id}</p>
        </div>
        <Link
          href="/"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Back to dashboard
        </Link>
      </div>

      <RunLiveView initialRun={run} />
    </div>
  );
}
