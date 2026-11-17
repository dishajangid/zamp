/** Soft tolerance: approve when within this band of PO remaining balance. */
export const SOFT_TOLERANCE_PERCENT = 0.02;
export const SOFT_TOLERANCE_ABS = 25;

/** Hard threshold: reject when both percent and absolute variance exceed these. */
export const HARD_TOLERANCE_PERCENT = 0.05;
export const HARD_TOLERANCE_ABS = 100;

export const STAGE_LABELS: Record<string, string> = {
  ingest: "Ingest",
  extract: "Extract fields",
  validate: "Validate required fields",
  match_vendor: "Match vendor",
  match_po: "Match purchase order",
  tolerance: "Amount tolerance check",
  duplicate: "Duplicate detection",
  decide: "Decision",
};

export const STAGE_ORDER = [
  "ingest",
  "extract",
  "validate",
  "match_vendor",
  "match_po",
  "tolerance",
  "duplicate",
  "decide",
] as const;
