export type Decision = "Approve" | "Hold" | "Reject";

export type StageName =
  | "ingest"
  | "extract"
  | "validate"
  | "match_vendor"
  | "match_po"
  | "tolerance"
  | "duplicate"
  | "decide";

export type StageStatus = "pending" | "running" | "completed" | "failed";

export interface Vendor {
  id: string;
  name: string;
  status: "approved" | "blocked";
}

export interface PurchaseOrder {
  poNumber: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  amountInvoiced: number;
  currency: string;
  status: "open" | "closed";
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface ExtractedInvoice {
  vendorName: string | null;
  vendorId: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  poNumber: string | null;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  currency: string | null;
  lineItems: LineItem[];
  rawText: string;
  confidence: number;
}

export interface StageResult {
  name: StageName;
  label: string;
  status: StageStatus;
  startedAt?: string;
  completedAt?: string;
  payload?: Record<string, unknown>;
  error?: string;
}

export interface ReasonCode {
  code: string;
  message: string;
}

export interface PipelineResult {
  decision: Decision;
  reasons: ReasonCode[];
  extracted: ExtractedInvoice;
  stages: StageResult[];
  matchedVendor?: Vendor | null;
  matchedPo?: PurchaseOrder | null;
  remainingBalance?: number | null;
  variance?: {
    absolute: number;
    percent: number;
    withinSoft: boolean;
    withinHard: boolean;
  } | null;
  isDuplicate?: boolean;
}

export type RunStatus = "queued" | "running" | "completed" | "failed";

export interface InvoiceRun {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: RunStatus;
  filename: string;
  fixtureId?: string;
  /** Seeded dashboard examples are excluded from live duplicate detection. */
  seeded?: boolean;
  decision?: Decision;
  reasons?: ReasonCode[];
  stages: StageResult[];
  extracted?: ExtractedInvoice;
  matchedVendor?: Vendor | null;
  matchedPo?: PurchaseOrder | null;
  remainingBalance?: number | null;
  variance?: PipelineResult["variance"];
  isDuplicate?: boolean;
  error?: string;
}

export interface PriorInvoiceRecord {
  vendorKey: string;
  invoiceNumber: string;
  decision: Decision;
}
