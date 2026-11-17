import fs from "fs";
import path from "path";
import { fixturesDir, invoicesDir } from "@/lib/paths";
import type { PurchaseOrder, Vendor } from "@/lib/types";

export interface CaseMeta {
  id: string;
  label: string;
  file: string;
  scenario: string;
  expectedDecision: "Approve" | "Hold" | "Reject";
}

export function loadVendors(): Vendor[] {
  return JSON.parse(
    fs.readFileSync(path.join(fixturesDir(), "vendors.json"), "utf8")
  ) as Vendor[];
}

export function loadPos(): PurchaseOrder[] {
  return JSON.parse(
    fs.readFileSync(path.join(fixturesDir(), "pos.json"), "utf8")
  ) as PurchaseOrder[];
}

export function loadCases(): CaseMeta[] {
  return JSON.parse(
    fs.readFileSync(path.join(fixturesDir(), "cases.json"), "utf8")
  ) as CaseMeta[];
}

export function fixturePdfPath(filename: string): string {
  return path.join(invoicesDir(), filename);
}

export function readFixturePdf(filename: string): Buffer {
  return fs.readFileSync(fixturePdfPath(filename));
}
