import fs from "fs";
import { createRun, getRun, priorFromCompletedRuns, updateRun } from "@/lib/db";
import { loadPos, loadVendors } from "@/lib/load-fixtures";
import { runPipeline } from "@/lib/pipeline/run";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/rules";
import type { InvoiceRun, StageResult } from "@/lib/types";
import { randomUUID } from "crypto";

function initialStages(): StageResult[] {
  return STAGE_ORDER.map((name) => ({
    name,
    label: STAGE_LABELS[name],
    status: "pending" as const,
  }));
}

export async function startRunFromFile(options: {
  filename: string;
  filepath: string;
  fixtureId?: string;
  stageDelayMs?: number;
}): Promise<InvoiceRun> {
  const now = new Date().toISOString();
  const run: InvoiceRun = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: "queued",
    filename: options.filename,
    fixtureId: options.fixtureId,
    stages: initialStages(),
  };
  createRun(run);

  // Process asynchronously so the API can return the run id immediately.
  void processRun(run.id, options.filepath, options.stageDelayMs ?? 450);

  return run;
}

export async function processRun(
  runId: string,
  filepath: string,
  stageDelayMs: number
): Promise<InvoiceRun> {
  updateRun(runId, { status: "running" });
  try {
    const pdfBuffer = fs.readFileSync(filepath);
    const vendors = loadVendors();
    const pos = loadPos();
    const prior = priorFromCompletedRuns(runId);

    const result = await runPipeline({
      filename: getRun(runId)?.filename || pathBasename(filepath),
      pdfBuffer,
      vendors,
      pos,
      priorInvoices: prior,
      stageDelayMs,
      onStage: async (stages) => {
        updateRun(runId, { stages, status: "running" });
      },
    });

    return updateRun(runId, {
      status: "completed",
      decision: result.decision,
      reasons: result.reasons,
      stages: result.stages,
      extracted: result.extracted,
      matchedVendor: result.matchedVendor,
      matchedPo: result.matchedPo,
      remainingBalance: result.remainingBalance,
      variance: result.variance,
      isDuplicate: result.isDuplicate,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return updateRun(runId, {
      status: "failed",
      error: message,
    });
  }
}

function pathBasename(p: string): string {
  return p.split(/[/\\]/).pop() || p;
}

/** Synchronous end-to-end run used by seed and tests that need completed state. */
export async function runFixtureToCompletion(options: {
  filename: string;
  filepath: string;
  fixtureId?: string;
  stageDelayMs?: number;
  seeded?: boolean;
  /** When seeding, pass accumulating priors so TR-4 still rejects. */
  priorInvoices?: import("@/lib/types").PriorInvoiceRecord[];
}): Promise<InvoiceRun> {
  const now = new Date().toISOString();
  const run: InvoiceRun = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: "running",
    filename: options.filename,
    fixtureId: options.fixtureId,
    seeded: options.seeded,
    stages: initialStages(),
  };
  createRun(run);

  const pdfBuffer = fs.readFileSync(options.filepath);
  const priorInvoices =
    options.priorInvoices ??
    (options.seeded ? [] : priorFromCompletedRuns(run.id));

  const result = await runPipeline({
    filename: options.filename,
    pdfBuffer,
    vendors: loadVendors(),
    pos: loadPos(),
    priorInvoices,
    stageDelayMs: options.stageDelayMs ?? 0,
    onStage: async (stages) => {
      updateRun(run.id, { stages });
    },
  });

  return updateRun(run.id, {
    status: "completed",
    decision: result.decision,
    reasons: result.reasons,
    stages: result.stages,
    extracted: result.extracted,
    matchedVendor: result.matchedVendor,
    matchedPo: result.matchedPo,
    remainingBalance: result.remainingBalance,
    variance: result.variance,
    isDuplicate: result.isDuplicate,
    seeded: options.seeded,
  });
}
