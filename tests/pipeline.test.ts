import fs from "fs";
import path from "path";
import { beforeAll, describe, expect, it } from "vitest";
import { loadCases, loadPos, loadVendors, fixturePdfPath } from "@/lib/load-fixtures";
import { runPipeline, toPriorRecord } from "@/lib/pipeline/run";
import { STAGE_ORDER } from "@/lib/rules";
import type { PriorInvoiceRecord } from "@/lib/types";

describe("PS-1 invoice pipeline test runs", () => {
  const cases = loadCases();
  const vendors = loadVendors();
  const pos = loadPos();

  beforeAll(() => {
    for (const c of cases) {
      const p = fixturePdfPath(c.file);
      expect(fs.existsSync(p), `Missing fixture ${c.file}. Run npm run fixtures`).toBe(
        true
      );
    }
  });

  it("TR-1 happy path → Approve", async () => {
    const meta = cases.find((c) => c.id === "TR-1")!;
    const result = await runPipeline({
      filename: meta.file,
      pdfBuffer: fs.readFileSync(fixturePdfPath(meta.file)),
      vendors,
      pos,
      priorInvoices: [],
    });

    expect(result.stages.map((s) => s.name)).toEqual([...STAGE_ORDER]);
    expect(result.stages.every((s) => s.status === "completed")).toBe(true);
    expect(result.extracted.invoiceNumber).toBe("INV-10001");
    expect(result.extracted.poNumber).toBe("PO-5001");
    expect(result.extracted.total).toBe(1500);
    expect(result.matchedPo?.poNumber).toBe("PO-5001");
    expect(result.decision).toBe("Approve");
    expect(result.reasons.some((r) => r.code === "MATCHED_CLEAN")).toBe(true);
  });

  it("TR-2 within tolerance → Approve with TOLERANCE_APPLIED", async () => {
    const meta = cases.find((c) => c.id === "TR-2")!;
    const result = await runPipeline({
      filename: meta.file,
      pdfBuffer: fs.readFileSync(fixturePdfPath(meta.file)),
      vendors,
      pos,
      priorInvoices: [],
    });

    expect(result.extracted.invoiceNumber).toBe("INV-20001");
    expect(result.extracted.total).toBe(2030);
    expect(result.variance?.withinSoft).toBe(true);
    expect(result.variance?.absolute).toBeCloseTo(30, 5);
    expect(result.decision).toBe("Approve");
    expect(result.reasons.some((r) => r.code === "TOLERANCE_APPLIED")).toBe(
      true
    );
  });

  it("TR-3 missing / invalid PO → Hold", async () => {
    const meta = cases.find((c) => c.id === "TR-3")!;
    const result = await runPipeline({
      filename: meta.file,
      pdfBuffer: fs.readFileSync(fixturePdfPath(meta.file)),
      vendors,
      pos,
      priorInvoices: [],
    });

    expect(result.extracted.invoiceNumber).toBe("INV-30001");
    expect(result.extracted.poNumber).toBe("PO-9999");
    expect(result.matchedPo).toBeNull();
    expect(result.decision).toBe("Hold");
    expect(result.reasons.some((r) => r.code === "PO_NOT_FOUND")).toBe(true);
  });

  it("TR-4 duplicate invoice → Reject", async () => {
    const happy = cases.find((c) => c.id === "TR-1")!;
    const first = await runPipeline({
      filename: happy.file,
      pdfBuffer: fs.readFileSync(fixturePdfPath(happy.file)),
      vendors,
      pos,
      priorInvoices: [],
    });
    expect(first.decision).toBe("Approve");

    const prior: PriorInvoiceRecord[] = [toPriorRecord(first)!];
    const meta = cases.find((c) => c.id === "TR-4")!;
    const result = await runPipeline({
      filename: meta.file,
      pdfBuffer: fs.readFileSync(fixturePdfPath(meta.file)),
      vendors,
      pos,
      priorInvoices: prior,
    });

    expect(result.extracted.invoiceNumber).toBe("INV-10001");
    expect(result.isDuplicate).toBe(true);
    expect(result.decision).toBe("Reject");
    expect(result.reasons.some((r) => r.code === "DUPLICATE_INVOICE")).toBe(
      true
    );
  });

  it("cases.json expected decisions match fixture matrix", () => {
    const expected = Object.fromEntries(
      cases.map((c) => [c.id, c.expectedDecision])
    );
    expect(expected).toEqual({
      "TR-1": "Approve",
      "TR-2": "Approve",
      "TR-3": "Hold",
      "TR-4": "Reject",
    });
    expect(cases.map((c) => c.file)).toEqual([
      "happy-path.pdf",
      "tolerance.pdf",
      "missing-po.pdf",
      "duplicate.pdf",
    ]);
    // silence unused import in matrix-only assertion environments
    expect(path.basename(fixturePdfPath("happy-path.pdf"))).toBe(
      "happy-path.pdf"
    );
  });
});
