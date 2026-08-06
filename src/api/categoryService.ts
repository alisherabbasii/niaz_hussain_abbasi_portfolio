import { apiClient } from './client';
import type { Category } from './types';

/**
 * Categories are the blog's single first-class taxonomy — every blog post
 * belongs to exactly one (see `category_id` on `BlogPost`). `index.php` is a
 * public read (used by the public blog listing's filter pills and the admin
 * Category management pages); create/update/delete require an authenticated
 * admin session — see `backend/api/categories/*.php`.
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

export interface CreateCategoryInput {
  name: string;
  description?: string;
}

export interface UpdateCategoryInput {
  name: string;
  slug?: string;
  description?: string;
}

/** GET /api/categories/index.php */
export async function listCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<CategoryListEnvelope>('/categories/index.php');
  return data.data;
}

/** POST /api/categories/create.php — requires an authenticated admin session. */
export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const { data } = await apiClient.post<CategoryEnvelope>('/categories/create.php', input);
  return data.data;
}

/** PUT /api/categories/update.php?id=… — requires an authenticated admin session. */
export async function updateCategory(id: number, input: UpdateCategoryInput): Promise<Category> {
  const { data } = await apiClient.put<CategoryEnvelope>('/categories/update.php', input, { params: { id } });
  return data.data;
}

/** DELETE /api/categories/delete.php?id=… — requires an authenticated admin session. */
export async function deleteCategory(id: number): Promise<number> {
  const { data } = await apiClient.delete<DeletedEnvelope>('/categories/delete.php', { params: { id } });
  return data.data.id;
}
