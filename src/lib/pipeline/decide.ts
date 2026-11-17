import type { Decision, ReasonCode } from "@/lib/types";
import type { ToleranceResult, VendorMatchKind } from "@/lib/pipeline/match";

export interface DecideInput {
  criticalMissing: boolean;
  validationReasons: ReasonCode[];
  vendorKind: VendorMatchKind;
  vendorBlocked: boolean;
  poFound: boolean;
  poNumberPresent: boolean;
  tolerance: ToleranceResult | null;
  isDuplicate: boolean;
  fuzzyVendorOnly: boolean;
}

export interface DecideOutput {
  decision: Decision;
  reasons: ReasonCode[];
}

export function decide(input: DecideInput): DecideOutput {
  const reasons: ReasonCode[] = [...input.validationReasons];

  if (input.criticalMissing) {
    return { decision: "Reject", reasons };
  }

  if (input.isDuplicate) {
    reasons.push({
      code: "DUPLICATE_INVOICE",
      message:
        "An invoice with the same vendor and invoice number was already processed.",
    });
    return { decision: "Reject", reasons };
  }

  if (input.vendorKind === "none") {
    reasons.push({
      code: "UNKNOWN_VENDOR",
      message: "Vendor is not on the approved vendor list.",
    });
    return { decision: "Reject", reasons };
  }

  if (input.vendorBlocked) {
    reasons.push({
      code: "VENDOR_BLOCKED",
      message: "Vendor is blocked in procurement.",
    });
    return { decision: "Reject", reasons };
  }

  if (!input.poFound) {
    reasons.push({
      code: input.poNumberPresent ? "PO_NOT_FOUND" : "PO_MISSING",
      message: input.poNumberPresent
        ? "PO reference on the invoice was not found in procurement data. AP review required."
        : "No PO reference on the invoice. AP review required.",
    });
    return { decision: "Hold", reasons };
  }

  if (input.tolerance && !input.tolerance.withinHard) {
    reasons.push({
      code: "AMOUNT_OUTSIDE_HARD_TOLERANCE",
      message: `Invoice total exceeds hard tolerance (variance ${input.tolerance.absolute.toFixed(2)}, ${(input.tolerance.percent * 100).toFixed(2)}%).`,
    });
    return { decision: "Reject", reasons };
  }

  if (input.tolerance && !input.tolerance.withinSoft) {
    reasons.push({
      code: "AMOUNT_OUTSIDE_SOFT_TOLERANCE",
      message: `Invoice total is outside soft tolerance but within hard threshold. AP review required.`,
    });
    return { decision: "Hold", reasons };
  }

  if (input.fuzzyVendorOnly) {
    reasons.push({
      code: "VENDOR_FUZZY_MATCH",
      message: "Vendor matched by fuzzy name only. Confirm identity before payment.",
    });
    return { decision: "Hold", reasons };
  }

  if (input.tolerance && input.tolerance.absolute > 0.009) {
    reasons.push({
      code: "TOLERANCE_APPLIED",
      message: `Amount variance ${input.tolerance.absolute.toFixed(2)} (${(input.tolerance.percent * 100).toFixed(2)}%) is within soft tolerance; approved.`,
    });
  } else {
    reasons.push({
      code: "MATCHED_CLEAN",
      message: "Vendor, PO, and amount matched within policy. Ready for payment.",
    });
  }

  return { decision: "Approve", reasons };
}
