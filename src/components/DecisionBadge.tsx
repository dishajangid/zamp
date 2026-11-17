import { decisionClasses } from "@/lib/format";
import type { Decision } from "@/lib/types";

export function DecisionBadge({
  decision,
  large = false,
}: {
  decision?: Decision;
  large?: boolean;
}) {
  const label = decision || "Pending";
  return (
    <span
      className={`inline-flex items-center rounded border font-medium ${decisionClasses(
        decision
      )} ${large ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"}`}
    >
      {label}
    </span>
  );
}
