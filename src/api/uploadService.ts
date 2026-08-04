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

/**
 * POST /api/upload/cover.php — a blog post's cover image. Requires an
 * authenticated admin session. `onProgress` (0-100) is best-effort — some
 * environments (e.g. no request body size known) may never call it.
 */
export async function uploadCoverImage(file: File, onProgress?: (percent: number) => void): Promise<UploadResult> {
  const { data } = await apiClient.post<UploadEnvelope>('/upload/cover.php', fileFormData(file), {
    onUploadProgress: onProgress
      ? (event) => onProgress(event.total ? Math.round((event.loaded / event.total) * 100) : 0)
      : undefined,
  });
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

/**
 * Resolve a stored upload path (e.g. `/uploads/blog/covers/xyz.jpg`, as
 * returned by `uploadCoverImage`/persisted on a post) into a URL the browser
 * can actually load. Same-origin passthrough when `VITE_API_BASE_URL` is
 * relative (the default — production serves the built frontend and
 * backend/api from one Apache origin, see docs/03-DEPLOYMENT.md). When
 * `VITE_API_BASE_URL` points at a different origin (e.g. a local PHP
 * dev server on another port than the Vite dev server), uploads are assumed
 * to be served from that same backend origin, not the Vite dev server's.
 */
export function resolveUploadUrl(path: string | null | undefined): string {
  if (!path) return '';

  const base = import.meta.env.VITE_API_BASE_URL ?? '/api';

  try {
    const backendOrigin = new URL(base, window.location.origin).origin;
    return backendOrigin === window.location.origin ? path : `${backendOrigin}${path}`;
  } catch {
    return path;
  }
}
