# Demo script (5 minutes)

Record in Loom (or equivalent). One continuous take is fine. No slides.

## Setup before recording
```bash
npm install
npm run fixtures
npm test
npm run seed
npm run dev
```
Open http://localhost:3000. Confirm Run history shows TR-1…TR-4.

## Narration and click path

### 0:00–0:30 — Problem
> “This is an AP invoice decision process. Input is a vendor invoice PDF. The system extracts fields, matches vendor and PO, applies tolerance and duplicate rules, and returns Approve, Hold, or Reject with reasons. Every stage is visible.”

Show the dashboard briefly.

### 0:30–2:00 — TR-1 Happy path
1. Click **TR-1 Happy path**.
2. Watch stages complete on the live run view.
3. Point to extracted vendor, invoice number, PO, total.
4. Point to decision **Approve** and reason `MATCHED_CLEAN`.

> “Clean PDF, approved vendor, PO found, amount within remaining balance — Approve.”

### 2:00–3:00 — TR-3 Missing PO
1. Back to dashboard → **TR-3 Missing PO**.
2. Show `PO-9999` extracted but not matched.
3. Decision **Hold**, reason `PO_NOT_FOUND`.

> “Invalid PO reference. We don’t reject blindly — we hold for AP review with a clear remediation signal.”

### 3:00–4:00 — TR-4 Duplicate
1. Run **TR-4 Duplicate invoice** (uses the live TR-1 you just approved as the prior record).
2. Show duplicate stage flagging prior INV-10001.
3. Decision **Reject**, reason `DUPLICATE_INVOICE`.

> “Same vendor and invoice number as the approved run we just completed. That’s a control failure if it slips through.”

### 4:00–4:45 — Dashboard
Return to dashboard. Scroll run history. Mention TR-2 (tolerance Approve) is available the same way.

> “History retains status, amounts, and decisions across runs so AP can audit what the process did.”

### 4:45–5:00 — Close
> “Automated tests cover all four cases via `npm test`. Next I’d add email ingestion and OCR for scans — intentionally out of scope here so the core decision path stays reliable.”

Stop at 5:00.
