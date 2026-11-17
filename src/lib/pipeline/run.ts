import { decide } from "@/lib/pipeline/decide";
import { extractFromPdfBuffer, parseInvoiceText } from "@/lib/pipeline/extract";
import {
  checkTolerance,
  findDuplicate,
  matchPo,
  matchVendor,
  remainingBalance,
  vendorKey,
} from "@/lib/pipeline/match";
import { validateExtracted } from "@/lib/pipeline/validate";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/rules";
import type {
  PriorInvoiceRecord,
  PipelineResult,
  PurchaseOrder,
  StageName,
  StageResult,
  Vendor,
} from "@/lib/types";

function emptyStages(): StageResult[] {
  return STAGE_ORDER.map((name) => ({
    name,
    label: STAGE_LABELS[name],
    status: "pending",
  }));
}

function completeStage(
  stages: StageResult[],
  name: StageName,
  payload: Record<string, unknown>
): void {
  const stage = stages.find((s) => s.name === name);
  if (!stage) return;
  stage.status = "completed";
  stage.completedAt = new Date().toISOString();
  stage.payload = payload;
  if (!stage.startedAt) stage.startedAt = stage.completedAt;
}

function startStage(stages: StageResult[], name: StageName): void {
  const stage = stages.find((s) => s.name === name);
  if (!stage) return;
  stage.status = "running";
  stage.startedAt = new Date().toISOString();
}

export interface RunPipelineOptions {
  filename: string;
  pdfBuffer?: Buffer;
  rawText?: string;
  vendors: Vendor[];
  pos: PurchaseOrder[];
  priorInvoices: PriorInvoiceRecord[];
  onStage?: (stages: StageResult[]) => void | Promise<void>;
  stageDelayMs?: number;
}

async function maybeDelay(ms: number): Promise<void> {
  if (ms > 0) await new Promise((r) => setTimeout(r, ms));
}

export async function runPipeline(
  options: RunPipelineOptions
): Promise<PipelineResult> {
  const {
    filename,
    pdfBuffer,
    rawText,
    vendors,
    pos,
    priorInvoices,
    onStage,
    stageDelayMs = 0,
  } = options;

  const stages = emptyStages();
  const emit = async () => {
    if (onStage) await onStage(stages.map((s) => ({ ...s })));
  };

  startStage(stages, "ingest");
  await maybeDelay(stageDelayMs);
  completeStage(stages, "ingest", {
    filename,
    bytes: pdfBuffer?.byteLength ?? Buffer.byteLength(rawText || "", "utf8"),
  });
  await emit();

  startStage(stages, "extract");
  await maybeDelay(stageDelayMs);
  const extracted = rawText
    ? parseInvoiceText(rawText)
    : await extractFromPdfBuffer(pdfBuffer!);
  completeStage(stages, "extract", {
    vendorName: extracted.vendorName,
    vendorId: extracted.vendorId,
    invoiceNumber: extracted.invoiceNumber,
    invoiceDate: extracted.invoiceDate,
    poNumber: extracted.poNumber,
    total: extracted.total,
    currency: extracted.currency,
    lineItemCount: extracted.lineItems.length,
    confidence: extracted.confidence,
  });
  await emit();

  startStage(stages, "validate");
  await maybeDelay(stageDelayMs);
  const validation = validateExtracted(extracted);
  completeStage(stages, "validate", {
    ok: validation.ok,
    missing: validation.missing,
  });
  await emit();

  startStage(stages, "match_vendor");
  await maybeDelay(stageDelayMs);
  const vendorMatch = matchVendor(
    vendors,
    extracted.vendorId,
    extracted.vendorName
  );
  completeStage(stages, "match_vendor", {
    kind: vendorMatch.kind,
    vendor: vendorMatch.vendor,
  });
  await emit();

  startStage(stages, "match_po");
  await maybeDelay(stageDelayMs);
  const matchedPo = matchPo(
    pos,
    extracted.poNumber,
    vendorMatch.vendor?.id ?? extracted.vendorId
  );
  const remaining = matchedPo ? remainingBalance(matchedPo) : null;
  completeStage(stages, "match_po", {
    poNumber: extracted.poNumber,
    matched: Boolean(matchedPo),
    po: matchedPo,
    remainingBalance: remaining,
  });
  await emit();

  startStage(stages, "tolerance");
  await maybeDelay(stageDelayMs);
  const variance =
    matchedPo && extracted.total != null && remaining != null
      ? checkTolerance(extracted.total, remaining)
      : null;
  completeStage(stages, "tolerance", {
    skipped: !variance,
    variance,
  });
  await emit();

  startStage(stages, "duplicate");
  await maybeDelay(stageDelayMs);
  const dup = findDuplicate(
    priorInvoices,
    vendorMatch.vendor?.id ?? extracted.vendorId,
    extracted.vendorName,
    extracted.invoiceNumber
  );
  completeStage(stages, "duplicate", {
    isDuplicate: Boolean(dup),
    prior: dup,
  });
  await emit();

  startStage(stages, "decide");
  await maybeDelay(stageDelayMs);
  const decisionResult = decide({
    criticalMissing: !validation.ok,
    validationReasons: validation.reasons,
    vendorKind: vendorMatch.kind,
    vendorBlocked: vendorMatch.vendor?.status === "blocked",
    poFound: Boolean(matchedPo),
    poNumberPresent: Boolean(extracted.poNumber),
    tolerance: variance,
    isDuplicate: Boolean(dup),
    fuzzyVendorOnly: vendorMatch.kind === "fuzzy",
  });
  completeStage(stages, "decide", {
    decision: decisionResult.decision,
    reasons: decisionResult.reasons,
  });
  await emit();

  return {
    decision: decisionResult.decision,
    reasons: decisionResult.reasons,
    extracted,
    stages,
    matchedVendor: vendorMatch.vendor,
    matchedPo,
    remainingBalance: remaining,
    variance,
    isDuplicate: Boolean(dup),
  };
}

export function toPriorRecord(
  result: PipelineResult
): PriorInvoiceRecord | null {
  if (!result.extracted.invoiceNumber) return null;
  return {
    vendorKey: vendorKey(
      result.matchedVendor?.id ?? result.extracted.vendorId,
      result.extracted.vendorName
    ),
    invoiceNumber: result.extracted.invoiceNumber,
    decision: result.decision,
  };
}
