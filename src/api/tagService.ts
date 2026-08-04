import { apiClient } from './client';
import type { Tag } from './types';

/**
 * Tags are also find-or-created as a side effect of `blog/create.php` and
 * `blog/update.php` (see `backend/helpers/Blog.php::blog_sync_tags`).
 * `index.php` is a public read (used by the blog listing's filter pills);
 * create/update/delete require an authenticated admin session — see
 * `backend/api/tags/*.php`.
 */

interface TagEnvelope {
  data: Tag;
}

interface TagListEnvelope {
  data: Tag[];
}

interface DeletedEnvelope {
  message: string;
  data: { id: number };
}

/** GET /api/tags/index.php */
export async function listTags(): Promise<Tag[]> {
  const { data } = await apiClient.get<TagListEnvelope>('/tags/index.php');
  return data.data;
}

/** POST /api/tags/create.php — requires an authenticated admin session. */
export async function createTag(name: string): Promise<Tag> {
  const { data } = await apiClient.post<TagEnvelope>('/tags/create.php', { name });
  return data.data;
}

/** PUT /api/tags/update.php?id=… — requires an authenticated admin session. */
export async function updateTag(id: number, name: string): Promise<Tag> {
  const { data } = await apiClient.put<TagEnvelope>('/tags/update.php', { name }, { params: { id } });
  return data.data;
}

/** DELETE /api/tags/delete.php?id=… — requires an authenticated admin session. */
export async function deleteTag(id: number): Promise<number> {
  const { data } = await apiClient.delete<DeletedEnvelope>('/tags/delete.php', { params: { id } });
  return data.data.id;
}
