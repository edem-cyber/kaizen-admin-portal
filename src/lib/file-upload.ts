import axios from "axios";
import { tokenStorage } from "@/lib/auth/token-storage";
import { API_CONFIG } from "@/lib/api-client";

export interface FileUploadResponse {
  code: number;
  message: string;
  requestId: string;
  data: string; // The uploaded file CDN URL
}

/**
 * Uploads a file to the Kaizen Content service without creating additional resource associations.
 * Used for avatars, attachments, and standalone file uploads.
 */
export async function uploadFileResource(file: File): Promise<string> {
  const token =
    tokenStorage.getToken() ||
    (typeof window !== "undefined"
      ? localStorage.getItem("token") || localStorage.getItem("kaizen_token")
      : null);

  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post<FileUploadResponse>(
    `${API_CONFIG.contentBaseUrl}/api/v1/file-resource/file-upload`,
    formData,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "multipart/form-data",
      },
    }
  );

  if (!response.data || !response.data.data) {
    throw new Error(response.data?.message || "File upload failed");
  }

  return response.data.data;
}
