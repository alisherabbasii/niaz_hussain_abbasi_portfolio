import { apiClient } from './client';
import type {
  BlogPost,
  CreateBlogPostInput,
  ListBlogPostsParams,
  ListBlogPostsResult,
  RelatedPostsResult,
  UpdateBlogPostInput,
} from './types';

interface BlogPostEnvelope {
  data: BlogPost;
}

interface RelatedPostsEnvelope {
  data: RelatedPostsResult;
}

interface DeletedEnvelope {
  message: string;
  data: { id: number };
}

/** GET /api/blog/index.php — paginated list. Anonymous callers only ever see published posts. */
export async function listPosts(params: ListBlogPostsParams = {}): Promise<ListBlogPostsResult> {
  const { data } = await apiClient.get<ListBlogPostsResult>('/blog/index.php', { params });
  return data;
}

/** GET /api/blog/show.php?id=… — 404s (thrown as HttpError) for a draft post when unauthenticated. */
export async function getPostById(id: number): Promise<BlogPost> {
  const { data } = await apiClient.get<BlogPostEnvelope>('/blog/show.php', { params: { id } });
  return data.data;
}

/** GET /api/blog/show.php?slug=… — 404s (thrown as HttpError) for a draft post when unauthenticated. */
export async function getPostBySlug(slug: string): Promise<BlogPost> {
  const { data } = await apiClient.get<BlogPostEnvelope>('/blog/show.php', { params: { slug } });
  return data.data;
}

/**
 * GET /api/blog/related.php?slug=… — related posts (same category) plus
 * the previous/next post in publication order, for a given article.
 * Computed server-side with targeted queries, so this doesn't require
 * paging through every post in the blog to answer.
 */
export async function getRelatedPosts(slug: string): Promise<RelatedPostsResult> {
  const { data } = await apiClient.get<RelatedPostsEnvelope>('/blog/related.php', { params: { slug } });
  return data.data;
}

/** POST /api/blog/create.php — requires an authenticated admin session. */
export async function createPost(input: CreateBlogPostInput): Promise<BlogPost> {
  const { data } = await apiClient.post<BlogPostEnvelope>('/blog/create.php', input);
  return data.data;
}

/** PUT /api/blog/update.php?id=… — requires an authenticated admin session. Omitted fields are left unchanged. */
export async function updatePost(id: number, input: UpdateBlogPostInput): Promise<BlogPost> {
  const { data } = await apiClient.put<BlogPostEnvelope>('/blog/update.php', input, { params: { id } });
  return data.data;
}

/** DELETE /api/blog/delete.php?id=… — requires an authenticated admin session. */
export async function deletePost(id: number): Promise<number> {
  const { data } = await apiClient.delete<DeletedEnvelope>('/blog/delete.php', { params: { id } });
  return data.data.id;
}
