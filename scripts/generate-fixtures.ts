import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

const outDir = path.join(process.cwd(), "fixtures", "invoices");

interface InvoiceSpec {
  filename: string;
  vendor: string;
  vendorId: string;
  invoiceNumber: string;
  invoiceDate: string;
  poNumber: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  tax: number;
  currency: string;
}

function money(n: number): string {
  return n.toFixed(2);
}

async function writeInvoice(spec: InvoiceSpec): Promise<void> {
  const subtotal = spec.lineItems.reduce(
    (sum, li) => sum + li.quantity * li.unitPrice,
    0
  );
  const total = subtotal + spec.tax;

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "LETTER" });
    const stream = fs.createWriteStream(path.join(outDir, spec.filename));
    doc.pipe(stream);

    doc.fontSize(18).text("INVOICE", { align: "left" });
    doc.moveDown();
    doc.fontSize(11);
    doc.text(`Vendor: ${spec.vendor}`);
    doc.text(`Vendor ID: ${spec.vendorId}`);
    doc.text(`Invoice Number: ${spec.invoiceNumber}`);
    doc.text(`Invoice Date: ${spec.invoiceDate}`);
    doc.text(`PO Number: ${spec.poNumber}`);
    doc.moveDown();
    doc.text("Line Items");
    for (const li of spec.lineItems) {
      const amount = li.quantity * li.unitPrice;
      doc.text(
        `${li.description} | ${li.quantity} | ${money(li.unitPrice)} | ${money(amount)}`
      );
    }
    doc.moveDown();
    doc.text(`Subtotal: ${money(subtotal)}`);
    doc.text(`Tax: ${money(spec.tax)}`);
    doc.text(`Total: ${money(total)}`);
    doc.text(`Currency: ${spec.currency}`);

    doc.end();
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });
}

const specs: InvoiceSpec[] = [
  {
    filename: "happy-path.pdf",
    vendor: "Acme Supplies Inc",
    vendorId: "V-1001",
    invoiceNumber: "INV-10001",
    invoiceDate: "2026-01-15",
    poNumber: "PO-5001",
    lineItems: [
      { description: "Office chairs", quantity: 10, unitPrice: 120 },
      { description: "Desk lamps", quantity: 20, unitPrice: 15 },
    ],
    tax: 0,
    currency: "USD",
  },
  {
    filename: "tolerance.pdf",
    vendor: "Northwind Components LLC",
    vendorId: "V-1002",
    invoiceNumber: "INV-20001",
    invoiceDate: "2026-02-03",
    poNumber: "PO-5002",
    // PO remaining 2000; total 2030 = 1.5% overage (within soft tolerance)
    lineItems: [
      { description: "Industrial fasteners", quantity: 1, unitPrice: 2030 },
    ],
    tax: 0,
    currency: "USD",
  },
  {
    filename: "missing-po.pdf",
    vendor: "Globex Materials",
    vendorId: "V-1003",
    invoiceNumber: "INV-30001",
    invoiceDate: "2026-02-10",
    poNumber: "PO-9999",
    lineItems: [
      { description: "Raw polymer pellets", quantity: 5, unitPrice: 100 },
    ],
    tax: 0,
    currency: "USD",
  },
  {
    filename: "duplicate.pdf",
    vendor: "Acme Supplies Inc",
    vendorId: "V-1001",
    invoiceNumber: "INV-10001",
    invoiceDate: "2026-01-15",
    poNumber: "PO-5001",
    lineItems: [
      { description: "Office chairs", quantity: 10, unitPrice: 120 },
      { description: "Desk lamps", quantity: 20, unitPrice: 15 },
    ],
    tax: 0,
    currency: "USD",
  },
];

async function main(): Promise<void> {
  fs.mkdirSync(outDir, { recursive: true });
  for (const spec of specs) {
    await writeInvoice(spec);
    console.log(`Wrote fixtures/invoices/${spec.filename}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
