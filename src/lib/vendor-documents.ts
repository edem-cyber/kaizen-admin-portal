import { requisitionRequest } from "./api-client";

/**
 * VendorDocumentType enum mirrored from the OpenAPI spec. Kept in sync
 * manually because this type isn't in the Orval-generated models yet.
 */
export const VENDOR_DOCUMENT_TYPE = {
  w9: "w9",
  tax_id: "tax_id",
  business_license: "business_license",
  insurance_cert: "insurance_cert",
  banking_info: "banking_info",
  other: "other",
} as const;

export type VendorDocumentType =
  (typeof VENDOR_DOCUMENT_TYPE)[keyof typeof VENDOR_DOCUMENT_TYPE];

export const VENDOR_DOCUMENT_TYPE_LABELS: Record<VendorDocumentType, string> = {
  w9: "W-9",
  tax_id: "Tax ID",
  business_license: "Business License",
  insurance_cert: "Insurance Certificate",
  banking_info: "Banking Info",
  other: "Other",
};

/**
 * The list endpoint returns array<object{}> in the spec — fields aren't
 * documented. This type is best-effort; consumers should read defensively.
 */
export interface VendorDocumentListItem {
  id?: string;
  filename?: string;
  original_filename?: string;
  document_type?: VendorDocumentType;
  description?: string | null;
  is_required?: boolean;
  size?: number;
  uploaded_at?: string;
  created_at?: string;
}

export function readVendorDocument(
  raw: Record<string, unknown>,
): VendorDocumentListItem {
  const v = raw as VendorDocumentListItem;
  return {
    id: v.id,
    filename: v.filename ?? v.original_filename,
    original_filename: v.original_filename,
    document_type: v.document_type,
    description: v.description ?? null,
    is_required: v.is_required,
    size: v.size,
    uploaded_at: v.uploaded_at ?? v.created_at,
    created_at: v.created_at,
  };
}

export async function listVendorDocuments(
  vendorId: string,
): Promise<VendorDocumentListItem[]> {
  const raw = await requisitionRequest<unknown>({
    url: `/api/v1/vendors/${vendorId}/documents`,
    method: "GET",
  });
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => readVendorDocument(item as Record<string, unknown>))
    .filter((d) => !!d.id);
}

export interface UploadVendorDocumentInput {
  file: File;
  document_type: VendorDocumentType;
  description?: string;
  is_required?: boolean;
}

export async function uploadVendorDocument(
  vendorId: string,
  input: UploadVendorDocumentInput,
): Promise<VendorDocumentListItem> {
  const form = new FormData();
  form.append("file", input.file);
  form.append("document_type", input.document_type);
  if (input.description) form.append("description", input.description);
  if (input.is_required !== undefined) {
    form.append("is_required", String(input.is_required));
  }
  const raw = await requisitionRequest<Record<string, unknown>>({
    url: `/api/v1/vendors/${vendorId}/documents`,
    method: "POST",
    data: form,
    headers: { "Content-Type": "multipart/form-data" },
  });
  return readVendorDocument(raw);
}
