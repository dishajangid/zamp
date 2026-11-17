# AP Invoice Decision Engine

ASA Case Study · **PS-1** · Invoice processing

Takes a vendor invoice PDF, runs a staged matching process against purchase-order data, and returns **Approve**, **Hold**, or **Reject** with a visible reason trail and run history.

## Quick start

```bash
npm install
npm run fixtures
npm test
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Command | Purpose |
|---------|---------|
| `npm run fixtures` | Regenerate sample invoice PDFs |
| `npm test` | Run TR-1…TR-4 pipeline tests |
| `npm run seed` | Load dashboard with the four demo runs |
| `npm run dev` | Start the app locally |
| `npm run build && npm start` | Production build |

## Process

1. Ingest PDF  
2. Extract fields  
3. Validate required fields  
4. Match vendor  
5. Match purchase order  
6. Amount tolerance check  
7. Duplicate detection  
8. Decision  

Policy: [ASSUMPTIONS.md](ASSUMPTIONS.md) · Demo script: [DEMO.md](DEMO.md)

## Test runs

| ID | Fixture | Scenario | Expected |
|----|---------|----------|----------|
| TR-1 | `happy-path.pdf` | Exact PO, amount within remaining, approved vendor | Approve |
| TR-2 | `tolerance.pdf` | Total 1.5% over PO remaining | Approve (tolerance applied) |
| TR-3 | `missing-po.pdf` | PO `PO-9999` not in procurement data | Hold |
| TR-4 | `duplicate.pdf` | Same vendor + invoice # as prior approved run | Reject |

## Stack

Next.js · TypeScript · Tailwind · pdf-parse · Vitest  

No API keys required.

## Out of scope

Email ingestion, OCR for scans, ERP write-back, authentication.
