import { apiClient } from './client';
import type { UploadResult } from './types';

interface UploadEnvelope {
  data: UploadResult;
}

interface DeletedEnvelope {
  message: string;
  data: { id: number };
}

function fileFormData(file: File): FormData {
  const formData = new FormData();
  formData.append('file', file);
  return formData;
}

/** POST /api/upload/cover.php — a blog post's cover image. Requires an authenticated admin session. */
export async function uploadCoverImage(file: File): Promise<UploadResult> {
  const { data } = await apiClient.post<UploadEnvelope>('/upload/cover.php', fileFormData(file));
  return data.data;
}

/** POST /api/upload/editor.php — an in-editor content image. Requires an authenticated admin session. */
export async function uploadEditorImage(file: File): Promise<UploadResult> {
  const { data } = await apiClient.post<UploadEnvelope>('/upload/editor.php', fileFormData(file));
  return data.data;
}

/** DELETE /api/upload/delete.php?id=… — requires an authenticated admin session. */
export async function deleteUpload(id: number): Promise<number> {
  const { data } = await apiClient.delete<DeletedEnvelope>('/upload/delete.php', { params: { id } });
  return data.data.id;
}
