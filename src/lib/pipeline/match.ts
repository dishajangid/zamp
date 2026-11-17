import {
  HARD_TOLERANCE_ABS,
  HARD_TOLERANCE_PERCENT,
  SOFT_TOLERANCE_ABS,
  SOFT_TOLERANCE_PERCENT,
} from "@/lib/rules";
import type {
  PriorInvoiceRecord,
  PurchaseOrder,
  Vendor,
} from "@/lib/types";

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

export type VendorMatchKind = "exact_id" | "exact_name" | "fuzzy" | "none";

export interface VendorMatchResult {
  vendor: Vendor | null;
  kind: VendorMatchKind;
}

export function matchVendor(
  vendors: Vendor[],
  vendorId: string | null,
  vendorName: string | null
): VendorMatchResult {
  if (vendorId) {
    const byId = vendors.find(
      (v) => v.id.toLowerCase() === vendorId.toLowerCase()
    );
    if (byId) return { vendor: byId, kind: "exact_id" };
  }

  if (vendorName) {
    const exact = vendors.find(
      (v) => normalize(v.name) === normalize(vendorName)
    );
    if (exact) return { vendor: exact, kind: "exact_name" };

    let best: Vendor | null = null;
    let bestScore = Infinity;
    const target = normalize(vendorName);
    for (const v of vendors) {
      const score = levenshtein(normalize(v.name), target);
      const threshold = Math.max(3, Math.floor(target.length * 0.2));
      if (score < bestScore && score <= threshold) {
        best = v;
        bestScore = score;
      }
    }
    if (best) return { vendor: best, kind: "fuzzy" };
  }

  return { vendor: null, kind: "none" };
}

export function matchPo(
  pos: PurchaseOrder[],
  poNumber: string | null,
  vendorId?: string | null
): PurchaseOrder | null {
  if (!poNumber) return null;
  const found = pos.find(
    (p) => p.poNumber.toLowerCase() === poNumber.toLowerCase()
  );
  if (!found) return null;
  if (vendorId && found.vendorId.toLowerCase() !== vendorId.toLowerCase()) {
    return null;
  }
  return found;
}

export function remainingBalance(po: PurchaseOrder): number {
  return Math.max(0, po.amount - po.amountInvoiced);
}

export interface ToleranceResult {
  absolute: number;
  percent: number;
  withinSoft: boolean;
  withinHard: boolean;
}

export function checkTolerance(
  invoiceTotal: number,
  remaining: number
): ToleranceResult {
  // Partial invoices under remaining balance are valid.
  // Overage above remaining is measured against soft/hard policy.
  const overage = Math.max(0, invoiceTotal - remaining);
  const percent =
    remaining === 0 ? (overage === 0 ? 0 : 1) : overage / remaining;
  const withinSoft =
    overage === 0 ||
    overage <= SOFT_TOLERANCE_ABS ||
    percent <= SOFT_TOLERANCE_PERCENT;
  const withinHard = !(
    overage > HARD_TOLERANCE_ABS && percent > HARD_TOLERANCE_PERCENT
  );
  return { absolute: overage, percent, withinSoft, withinHard };
}

export function vendorKey(vendorId: string | null, vendorName: string | null): string {
  if (vendorId) return vendorId.toLowerCase();
  return normalize(vendorName || "");
}

export function findDuplicate(
  prior: PriorInvoiceRecord[],
  vendorId: string | null,
  vendorName: string | null,
  invoiceNumber: string | null
): PriorInvoiceRecord | null {
  if (!invoiceNumber) return null;
  const key = vendorKey(vendorId, vendorName);
  return (
    prior.find(
      (p) =>
        p.invoiceNumber.toLowerCase() === invoiceNumber.toLowerCase() &&
        p.vendorKey === key &&
        (p.decision === "Approve" || p.decision === "Hold")
    ) || null
  );
}
