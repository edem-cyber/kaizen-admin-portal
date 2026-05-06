import { kaizenAdminRequest } from "./api-client";

export interface DocumentListItem {
  id?: string;
  filename?: string;
  original_filename?: string;
  description?: string | null;
  size?: number;
  uploaded_at?: string;
  created_at?: string;
}

export function readDocumentFields(item: Record<string, unknown>): DocumentListItem {
  const obj = item as DocumentListItem;
  return {
    id: obj.id,
    filename: obj.filename ?? obj.original_filename,
    original_filename: obj.original_filename,
    description: obj.description ?? null,
    size: obj.size,
    uploaded_at: obj.uploaded_at ?? obj.created_at,
    created_at: obj.created_at,
  };
}

export async function downloadDocument(
  documentId: string,
  fallbackFilename: string,
): Promise<void> {
  const blob = await kaizenAdminRequest<Blob>({
    url: `/api/v1/documents/${documentId}/download`,
    method: "GET",
    responseType: "blob",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fallbackFilename || `document-${documentId}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
