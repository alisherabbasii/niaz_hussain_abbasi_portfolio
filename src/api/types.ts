/** Shared response/request shapes for `src/api/*Service.ts`, mirroring `backend/api/**` exactly. */

export interface Admin {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

/** Shape produced by `backend/helpers/Blog.php::blog_format_post`. */
export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string | null;
  category: string | null;
  tags: string[];
  featured: boolean;
  draft: boolean;
  seo_title: string | null;
  seo_description: string | null;
  publish_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListBlogPostsParams {
  page?: number;
  per_page?: number;
  /** Substring match against title/description/content. */
  search?: string;
  category?: string;
  tag?: string;
  featured?: boolean;
  /** Only honored for an authenticated admin; anonymous callers always get published-only results. */
  draft?: boolean;
}

export interface ListBlogPostsResult {
  data: BlogPost[];
  pagination: Pagination;
}

/** Body accepted by `backend/api/blog/create.php`. */
export interface CreateBlogPostInput {
  title: string;
  content: string;
  slug?: string;
  excerpt?: string;
  author?: string | number;
  category?: string;
  tags?: string[];
  featured?: boolean;
  draft?: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
  publish_date?: string | null;
}

/** Body accepted by `backend/api/blog/update.php`. Every field is optional — only supplied keys are changed. */
export type UpdateBlogPostInput = Partial<CreateBlogPostInput>;

/** Shape produced by `backend/api/upload/{cover,editor}.php`. */
export interface UploadResult {
  id: number;
  url: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}
