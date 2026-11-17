import path from "path";
import { pathToFileURL } from "url";
import { PDFParse } from "pdf-parse";
import type { ExtractedInvoice, LineItem } from "@/lib/types";

let workerConfigured = false;

function ensurePdfWorker(): void {
  if (workerConfigured) return;
  const workerFile = path.join(
    process.cwd(),
    "node_modules/pdf-parse/dist/pdf-parse/web/pdf.worker.mjs"
  );
  PDFParse.setWorker(pathToFileURL(workerFile).href);
  workerConfigured = true;
}

function matchField(text: string, label: string): string | null {
  const re = new RegExp(`${label}\\s*:\\s*(.+)`, "i");
  const m = text.match(re);
  if (!m) return null;
  return m[1].trim().split("\n")[0].trim();
}

function parseAmount(value: string | null): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[$,\s]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseLineItems(text: string): LineItem[] {
  const items: LineItem[] = [];
  const section = text.split(/Line Items/i)[1];
  if (!section) return items;

  const lines = section
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (/^(Subtotal|Tax|Total|Currency)/i.test(line)) break;
    // Description | Qty | Unit Price | Amount
    const parts = line.split("|").map((p) => p.trim());
    if (parts.length < 4) continue;
    const quantity = Number(parts[1]);
    const unitPrice = parseAmount(parts[2]);
    const amount = parseAmount(parts[3]);
    if (!Number.isFinite(quantity) || unitPrice == null || amount == null) continue;
    items.push({
      description: parts[0],
      quantity,
      unitPrice,
      amount,
    });
  }
  return items;
}

export function parseInvoiceText(rawText: string): ExtractedInvoice {
  const vendorName = matchField(rawText, "Vendor");
  const vendorId = matchField(rawText, "Vendor ID");
  const invoiceNumber = matchField(rawText, "Invoice Number");
  const invoiceDate = matchField(rawText, "Invoice Date");
  const poNumber = matchField(rawText, "PO Number");
  const subtotal = parseAmount(matchField(rawText, "Subtotal"));
  const tax = parseAmount(matchField(rawText, "Tax"));
  const total = parseAmount(matchField(rawText, "Total"));
  const currency = matchField(rawText, "Currency");
  const lineItems = parseLineItems(rawText);

  const requiredPresent = [
    vendorName,
    invoiceNumber,
    invoiceDate,
    total,
  ].filter(Boolean).length;

  const confidence = requiredPresent / 4;

  return {
    vendorName,
    vendorId,
    invoiceNumber,
    invoiceDate,
    poNumber: poNumber && poNumber.toUpperCase() !== "N/A" ? poNumber : null,
    subtotal,
    tax,
    total,
    currency,
    lineItems,
    rawText,
    confidence,
  };
}

export async function extractFromPdfBuffer(
  buffer: Buffer
): Promise<ExtractedInvoice> {
  ensurePdfWorker();
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return parseInvoiceText(result.text || "");
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}
