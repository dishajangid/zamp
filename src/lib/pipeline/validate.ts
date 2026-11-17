import type { ExtractedInvoice, ReasonCode } from "@/lib/types";

export interface ValidationResult {
  ok: boolean;
  missing: string[];
  reasons: ReasonCode[];
}

export function validateExtracted(extracted: ExtractedInvoice): ValidationResult {
  const missing: string[] = [];
  const reasons: ReasonCode[] = [];

  if (!extracted.invoiceNumber) missing.push("invoiceNumber");
  if (!extracted.total && extracted.total !== 0) missing.push("total");
  if (!extracted.vendorName) missing.push("vendorName");
  if (!extracted.invoiceDate) missing.push("invoiceDate");

  if (missing.includes("invoiceNumber")) {
    reasons.push({
      code: "MISSING_INVOICE_NUMBER",
      message: "Invoice number is required and was not found.",
    });
  }
  if (missing.includes("total")) {
    reasons.push({
      code: "MISSING_TOTAL",
      message: "Invoice total is required and was not found.",
    });
  }
  if (missing.includes("vendorName")) {
    reasons.push({
      code: "MISSING_VENDOR",
      message: "Vendor name is required and was not found.",
    });
  }
  if (missing.includes("invoiceDate")) {
    reasons.push({
      code: "MISSING_DATE",
      message: "Invoice date is required and was not found.",
    });
  }

  const criticalMissing =
    missing.includes("invoiceNumber") || missing.includes("total");

  return {
    ok: !criticalMissing,
    missing,
    reasons,
  };
}
