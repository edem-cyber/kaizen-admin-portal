import { kaizenAdminRequest } from "./api-client";

/**
 * Quote-document types mirrored from the OpenAPI spec. The enum is not
 * in the Orval-generated models yet.
 */
export const QUOTE_DOCUMENT_TYPE = {
  sow: "sow",
  price_breakdown: "price_breakdown",
  warranty: "warranty",
  reference_quote: "reference_quote",
  other: "other",
} as const;

export type QuoteDocumentType =
  (typeof QUOTE_DOCUMENT_TYPE)[keyof typeof QUOTE_DOCUMENT_TYPE];

export const QUOTE_DOCUMENT_TYPE_LABELS: Record<QuoteDocumentType, string> = {
  sow: "Statement of Work",
  price_breakdown: "Price Breakdown",
  warranty: "Warranty",
  reference_quote: "Reference Quote",
  other: "Other",
};

export interface VendorQuote {
  id: string;
  vendor_id: string;
  kaizenAdmin_id: string;
  organization_id?: number;
  quote_number?: string | null;
  quote_date?: string | null;
  valid_until: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  tax_amount?: number;
  shipping_cost?: number;
  other_costs?: number;
  total_amount: number;
  currency?: string;
  payment_terms: string;
  delivery_lead_time: string;
  warranty_terms?: string | null;
  is_selected?: boolean;
  selection_reason?: string | null;
}

export interface VendorQuoteCreate {
  vendor_id: string;
  kaizenAdmin_id: string;
  quote_number?: string;
  quote_date?: string;
  valid_until: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  tax_amount?: number;
  shipping_cost?: number;
  other_costs?: number;
  total_amount: number;
  currency?: string;
  payment_terms: string;
  delivery_lead_time: string;
  warranty_terms?: string;
}

export type VendorQuoteUpdate = Partial<
  Omit<VendorQuoteCreate, "vendor_id" | "kaizenAdmin_id">
>;

export interface QuoteDocumentListItem {
  id?: string;
  filename?: string;
  original_filename?: string;
  document_type?: QuoteDocumentType;
  description?: string | null;
  is_required?: boolean;
  size?: number;
  content_type?: string;
  uploaded_at?: string;
  created_at?: string;
  download_url?: string;
}

export function readQuoteDocument(
  raw: Record<string, unknown>,
): QuoteDocumentListItem {
  const v = raw as QuoteDocumentListItem;
  return {
    id: v.id,
    filename: v.filename ?? v.original_filename,
    original_filename: v.original_filename,
    document_type: v.document_type,
    description: v.description ?? null,
    is_required: v.is_required,
    size: v.size,
    content_type: v.content_type,
    uploaded_at: v.uploaded_at ?? v.created_at,
    created_at: v.created_at,
    download_url: v.download_url,
  };
}

// ── Quotes ──────────────────────────────────────────────────────────────

export async function listQuotesForKaizenAdmin(
  kaizenAdminId: string,
): Promise<VendorQuote[]> {
  const raw = await kaizenAdminRequest<unknown>({
    url: `/api/v1/vendors/quotes/kaizenAdmin/${kaizenAdminId}`,
    method: "GET",
  });
  return Array.isArray(raw) ? (raw as VendorQuote[]) : [];
}

export async function createVendorQuote(
  input: VendorQuoteCreate,
): Promise<VendorQuote> {
  return kaizenAdminRequest<VendorQuote>({
    url: "/api/v1/vendors/quotes",
    method: "POST",
    data: input,
  });
}

export async function updateVendorQuote(
  quoteId: string,
  input: VendorQuoteUpdate,
): Promise<VendorQuote> {
  return kaizenAdminRequest<VendorQuote>({
    url: `/api/v1/vendors/quotes/${quoteId}`,
    method: "PUT",
    data: input,
  });
}

export async function deleteVendorQuote(quoteId: string): Promise<void> {
  await kaizenAdminRequest<unknown>({
    url: `/api/v1/vendors/quotes/${quoteId}`,
    method: "DELETE",
  });
}

export async function selectVendorQuote(
  quoteId: string,
  selectionReason?: string,
): Promise<VendorQuote> {
  return kaizenAdminRequest<VendorQuote>({
    url: `/api/v1/vendors/quotes/${quoteId}/select`,
    method: "POST",
    data: selectionReason ? { selection_reason: selectionReason } : {},
  });
}

export async function deselectVendorQuote(
  quoteId: string,
): Promise<VendorQuote> {
  return kaizenAdminRequest<VendorQuote>({
    url: `/api/v1/vendors/quotes/${quoteId}/deselect`,
    method: "POST",
    data: {},
  });
}

// ── Quote documents ─────────────────────────────────────────────────────

export async function listQuoteDocuments(
  quoteId: string,
): Promise<QuoteDocumentListItem[]> {
  const raw = await kaizenAdminRequest<unknown>({
    url: `/api/v1/vendors/quotes/${quoteId}/documents`,
    method: "GET",
  });
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => readQuoteDocument(item as Record<string, unknown>))
    .filter((d) => !!d.id);
}

export interface UploadQuoteDocumentInput {
  file: File;
  document_type: QuoteDocumentType;
  description?: string;
  is_required?: boolean;
}

export async function uploadQuoteDocument(
  quoteId: string,
  input: UploadQuoteDocumentInput,
): Promise<QuoteDocumentListItem> {
  const form = new FormData();
  form.append("file", input.file);
  form.append("document_type", input.document_type);
  if (input.description) form.append("description", input.description);
  if (input.is_required !== undefined) {
    form.append("is_required", String(input.is_required));
  }
  const raw = await kaizenAdminRequest<Record<string, unknown>>({
    url: `/api/v1/vendors/quotes/${quoteId}/documents`,
    method: "POST",
    data: form,
    headers: { "Content-Type": "multipart/form-data" },
  });
  return readQuoteDocument(raw);
}
