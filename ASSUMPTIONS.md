# Assumptions

## Problem framing
Accounts Payable receives vendor invoices as PDFs and must decide Approve, Hold, or Reject by matching each invoice to procurement data (approved vendors and open purchase orders).

## Input contract
Invoice PDFs use labeled fields the extractor reads deterministically:

- Vendor
- Vendor ID
- Invoice Number
- Invoice Date
- PO Number
- Line Items (`Description | Qty | Unit Price | Amount`)
- Subtotal, Tax, Total, Currency

Procurement reference data lives in `fixtures/vendors.json` and `fixtures/pos.json`.

## Decision policy

| Outcome | Conditions |
|---------|------------|
| **Approve** | Required fields present; vendor approved; PO matched to vendor; invoice total does not exceed PO remaining beyond soft tolerance; not a duplicate |
| **Hold** | PO missing or not found; amount between soft and hard thresholds; vendor matched by fuzzy name only |
| **Reject** | Missing invoice number or total; unknown/blocked vendor; duplicate of a prior Approve/Hold; amount beyond hard threshold |

### Tolerance
Measured as **overage above PO remaining balance** (partial invoices under remaining are allowed).

- Soft (Approve with note): overage ≤ **2%** of remaining **or** ≤ **$25**
- Hard (Reject): overage **> 5%** of remaining **and** **> $100**
- Between soft and hard → Hold

### Duplicate detection
Same vendor key (vendor ID, else normalized name) + same invoice number as a prior **live** run with decision Approve or Hold → Reject.

Dashboard rows created by `npm run seed` are marked `seeded: true` and are excluded from live duplicate detection so demo buttons remain re-runnable. Seed itself still applies in-memory priors so TR-4 seeds as Reject.

## Out of scope
- Email inbox ingestion
- OCR for scanned image-only PDFs
- ERP / payment write-back
- Authentication and multi-tenant hosting
