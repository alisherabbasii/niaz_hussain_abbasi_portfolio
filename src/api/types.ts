/** Shared response/request shapes for `src/api/*Service.ts`, mirroring `backend/api/**` exactly. */

export interface Admin {
  id: number;
  name: string;
  username?: string;
  email: string;
  role: string;
}

/** Roles supported by the admin user-management module — see `backend/helpers/Permissions.php`. */
export type AdminRole = 'super_admin' | 'admin' | 'editor';

/** Shape produced by `backend/helpers/AdminUser.php::admin_user_format` — never includes password_hash. */
export interface AdminUser {
  id: number;
  full_name: string;
  username: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListAdminUsersParams {
  page?: number;
  per_page?: number;
  /** Substring match against full_name/username/email. */
  search?: string;
  role?: AdminRole;
  status?: 'active' | 'inactive';
}

export interface ListAdminUsersResult {
  data: AdminUser[];
  pagination: Pagination;
}

/** Body accepted by `backend/api/users/create.php`. */
export interface CreateAdminUserInput {
  full_name: string;
  username: string;
  email: string;
  role: AdminRole;
  is_active?: boolean;
  password: string;
  password_confirmation: string;
}

/** Body accepted by `backend/api/users/update.php`. Every field is optional — only supplied keys are changed; omitting/blanking `password` preserves the existing one. */
export type UpdateAdminUserInput = Partial<
  Omit<CreateAdminUserInput, 'password' | 'password_confirmation'>
> & {
  password?: string;
  password_confirmation?: string;
};

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
  cover_image: string | null;
  cover_image_alt: string | null;
  author: string | null;
  author_id: number;
  category: string | null;
  tags: string[];
  featured: boolean;
  draft: boolean;
  seo_title: string | null;
  seo_description: string | null;
  /** Scheduling target (may be in the future); see `backend/helpers/Blog.php::blog_compute_publish_state`. */
  publish_at: string | null;
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
  /** Sorts by updated_at; omit for the default order (published-then-created, newest first). */
  sort?: 'updated_desc' | 'updated_asc';
}

export interface ListBlogPostsResult {
  data: BlogPost[];
  pagination: Pagination;
}

/** Shape produced by `backend/api/blog/related.php`. */
export interface RelatedPostsResult {
  /** Up to a small fixed number, ranked by category match then shared tags then recency. Empty when nothing qualifies. */
  related: BlogPost[];
  /** Next-older public post in publication order, or null if this is the first. */
  previous: BlogPost | null;
  /** Next-newer public post in publication order, or null if this is the most recent. */
  next: BlogPost | null;
}

/** Body accepted by `backend/api/blog/create.php`. */
export interface CreateBlogPostInput {
  title: string;
  content: string;
  slug?: string;
  excerpt?: string;
  cover_image?: string | null;
  cover_image_alt?: string | null;
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
