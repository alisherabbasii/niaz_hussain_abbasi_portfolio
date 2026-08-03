import { apiClient } from './client';
import type { Category } from './types';

/**
 * Categories today only exist as a find-or-create side effect of
 * `blog/create.php` and `blog/update.php` (see
 * `backend/helpers/Blog.php::blog_resolve_category_id`) — there is no
 * standalone `backend/api/categories/*` yet. These calls are scaffolded
 * against the endpoints `docs/01-CMS-ARCHITECTURE.md` plans for admin
 * category management, following the same per-action file convention as
 * `backend/api/blog/*.php`. They will 404 until that backend work lands.
 */

interface CategoryEnvelope {
  data: Category;
}

interface CategoryListEnvelope {
  data: Category[];
}

interface DeletedEnvelope {
  message: string;
  data: { id: number };
}

/** GET /api/categories/index.php */
export async function listCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<CategoryListEnvelope>('/categories/index.php');
  return data.data;
}

/** POST /api/categories/create.php — requires an authenticated admin session. */
export async function createCategory(name: string): Promise<Category> {
  const { data } = await apiClient.post<CategoryEnvelope>('/categories/create.php', { name });
  return data.data;
}

/** PUT /api/categories/update.php?id=… — requires an authenticated admin session. */
export async function updateCategory(id: number, name: string): Promise<Category> {
  const { data } = await apiClient.put<CategoryEnvelope>('/categories/update.php', { name }, { params: { id } });
  return data.data;
}

/** DELETE /api/categories/delete.php?id=… — requires an authenticated admin session. */
export async function deleteCategory(id: number): Promise<number> {
  const { data } = await apiClient.delete<DeletedEnvelope>('/categories/delete.php', { params: { id } });
  return data.data.id;
}
