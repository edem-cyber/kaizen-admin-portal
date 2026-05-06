import { apiClient, API_CONFIG, requisitionRequest } from "./api-client";

export interface PaymentLine {
  budget_code: string;
  allocation_id?: string;
  amount: string;
  invoice_reference: string;
}

export interface PaymentHistoryEntry {
  payment_reference: string;
  payment_date: string;
  recorded_at: string;
  amount: string;
  lines: PaymentLine[];
}

export interface PaymentHistory {
  requisition_id: string;
  total_amount: string;
  amount_paid_to_date: string;
  amount_remaining: string;
  is_fully_paid: boolean;
  payments: PaymentHistoryEntry[];
}

export interface RecordPaymentRequest {
  amount: string;
  payment_reference: string;
  payment_date?: string;
}

export interface RecordPaymentLineResult {
  budget_code: string;
  apportioned_amount: string;
  invoice_reference: string;
  applied: boolean;
  was_replay: boolean;
  error: string | null;
}

export interface RecordPaymentResponse {
  requisition_id: string;
  payment_reference: string;
  payment_date: string;
  per_line: RecordPaymentLineResult[];
  total_amount: string;
  amount_paid_to_date: string;
  amount_remaining: string;
  is_fully_paid: boolean;
}

export interface BulkUploadRowError {
  row: number;
  requisition_id?: string | null;
  payment_reference?: string | null;
  error: string;
}

export interface BulkUploadResponse {
  batch_id: string;
  total_rows: number;
  processed: number;
  skipped: number;
  duplicates: number;
  errors: BulkUploadRowError[];
}

export interface ExportTemplateParams {
  start_date: string;
  end_date: string;
  include_fully_paid?: boolean;
}

export async function recordPayment(
  requisitionId: string,
  payload: RecordPaymentRequest,
): Promise<RecordPaymentResponse> {
  return requisitionRequest<RecordPaymentResponse>({
    url: `/api/v1/payments/requisitions/${requisitionId}`,
    method: "POST",
    data: payload,
  });
}

export async function getPaymentHistory(
  requisitionId: string,
): Promise<PaymentHistory> {
  return requisitionRequest<PaymentHistory>({
    url: `/api/v1/payments/requisitions/${requisitionId}`,
    method: "GET",
  });
}

function filenameFromContentDisposition(header?: string): string | null {
  if (!header) return null;
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function downloadPaymentTemplate(
  params: ExportTemplateParams,
): Promise<void> {
  const response = await apiClient.request<Blob>({
    baseURL: API_CONFIG.requisitionBaseUrl,
    url: "/api/v1/payments/export",
    method: "GET",
    responseType: "blob",
    params: {
      start_date: params.start_date,
      end_date: params.end_date,
      include_fully_paid: params.include_fully_paid ?? false,
    },
  });

  const filename =
    filenameFromContentDisposition(
      response.headers["content-disposition"] as string | undefined,
    ) ?? `requisitions-payments-${params.start_date}-${params.end_date}.xlsx`;

  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function uploadPaymentBatch(
  file: File,
): Promise<BulkUploadResponse> {
  const form = new FormData();
  form.append("file", file);
  return requisitionRequest<BulkUploadResponse>({
    url: "/api/v1/payments/upload",
    method: "POST",
    data: form,
    headers: { "Content-Type": "multipart/form-data" },
  });
}
