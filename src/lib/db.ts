import fs from "fs";
import path from "path";
import { dataDir, runsDbPath } from "@/lib/paths";
import type { InvoiceRun, PriorInvoiceRecord } from "@/lib/types";
import { vendorKey } from "@/lib/pipeline/match";

function ensureStore(): void {
  const dir = dataDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(runsDbPath())) {
    fs.writeFileSync(runsDbPath(), JSON.stringify({ runs: [] }, null, 2));
  }
}

function readAll(): InvoiceRun[] {
  ensureStore();
  const raw = fs.readFileSync(runsDbPath(), "utf8");
  const parsed = JSON.parse(raw) as { runs: InvoiceRun[] };
  return parsed.runs || [];
}

function writeAll(runs: InvoiceRun[]): void {
  ensureStore();
  const tmp = `${runsDbPath()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify({ runs }, null, 2));
  fs.renameSync(tmp, runsDbPath());
}

export function listRuns(): InvoiceRun[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getRun(id: string): InvoiceRun | undefined {
  return readAll().find((r) => r.id === id);
}

export function createRun(run: InvoiceRun): InvoiceRun {
  const runs = readAll();
  runs.push(run);
  writeAll(runs);
  return run;
}

export function updateRun(id: string, patch: Partial<InvoiceRun>): InvoiceRun {
  const runs = readAll();
  const idx = runs.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error(`Run not found: ${id}`);
  runs[idx] = {
    ...runs[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writeAll(runs);
  return runs[idx];
}

export function clearRuns(): void {
  writeAll([]);
}

export function priorFromCompletedRuns(
  excludeRunId?: string
): PriorInvoiceRecord[] {
  return readAll()
    .filter(
      (r) =>
        r.id !== excludeRunId &&
        !r.seeded &&
        r.status === "completed" &&
        r.decision &&
        r.extracted?.invoiceNumber
    )
    .map((r) => ({
      vendorKey: vendorKey(
        r.matchedVendor?.id ?? r.extracted?.vendorId ?? null,
        r.extracted?.vendorName ?? null
      ),
      invoiceNumber: r.extracted!.invoiceNumber!,
      decision: r.decision!,
    }));
}

export function ensureUploadDir(): string {
  const dir = path.join(dataDir(), "uploads");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}
