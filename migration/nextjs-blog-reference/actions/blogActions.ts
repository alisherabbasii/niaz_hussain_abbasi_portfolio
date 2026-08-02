"use server";

import { getBlogs, deleteBlog } from '@/data/blogService';
import { revalidatePath } from 'next/cache';

export async function fetchBlogsList() {
  return await getBlogs();
}

export async function removeBlogAction(slug: string) {
  try {
    const success = await deleteBlog(slug);
    if (success) {
      revalidatePath('/admin/blogs');
      revalidatePath('/blog');
      revalidatePath(`/blog/${slug}`);
    }
    return { success };
  } catch (error) {
    return { success: false, error: 'Could not delete' };
  }
}
