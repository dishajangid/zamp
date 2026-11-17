import type { Decision } from "@/lib/types";

export function formatMoney(
  amount: number | null | undefined,
  currency = "USD"
): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function decisionClasses(decision?: Decision): string {
  switch (decision) {
    case "Approve":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "Hold":
      return "bg-amber-50 text-amber-900 border-amber-200";
    case "Reject":
      return "bg-red-50 text-red-800 border-red-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}
