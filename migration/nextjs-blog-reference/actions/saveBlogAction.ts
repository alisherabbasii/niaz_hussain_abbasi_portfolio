"use server";

import { createBlog, updateBlog, BlogPost, getBlogBySlug } from '@/data/blogService';
import { revalidatePath } from 'next/cache';

export async function saveBlogAction(blogData: BlogPost, isEdit: boolean) {
  try {
    let result;
    if (isEdit) {
      result = await updateBlog(blogData.slug, blogData);
    } else {
      // Validate slug uniqueness on creation
      const existing = await getBlogBySlug(blogData.slug);
      if (existing) {
        return { success: false, error: 'A blog with this auto-generated slug already exists.' };
      }
      result = await createBlog(blogData);
    }
    
    // Invalidate caches
    revalidatePath('/admin/blogs');
    revalidatePath('/blog');
    revalidatePath(`/blog/${blogData.slug}`);
    
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to save blog' };
  }
}

export async function fetchBlogAction(slug: string) {
  return await getBlogBySlug(slug);
}
