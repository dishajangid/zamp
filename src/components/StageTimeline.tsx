import type { StageResult } from "@/lib/types";

function statusDot(status: StageResult["status"]): string {
  switch (status) {
    case "completed":
      return "bg-emerald-500";
    case "running":
      return "bg-sky-500 animate-pulse";
    case "failed":
      return "bg-red-500";
    default:
      return "bg-slate-300";
  }
}

export function StageTimeline({ stages }: { stages: StageResult[] }) {
  return (
    <ol className="space-y-3">
      {stages.map((stage) => (
        <li
          key={stage.name}
          className="rounded-lg border border-slate-200 bg-white p-3"
        >
          <div className="flex items-center gap-3">
            <span
              className={`h-2.5 w-2.5 rounded-full ${statusDot(stage.status)}`}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">
                  {stage.label}
                </p>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {stage.status}
                </p>
              </div>
              {stage.payload && stage.status === "completed" && (
                <pre className="mt-2 overflow-x-auto rounded bg-slate-50 p-2 text-xs text-slate-700">
                  {JSON.stringify(stage.payload, null, 2)}
                </pre>
              )}
              {stage.error && (
                <p className="mt-2 text-xs text-red-700">{stage.error}</p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
