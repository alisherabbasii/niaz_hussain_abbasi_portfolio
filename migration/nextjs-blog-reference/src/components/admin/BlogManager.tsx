"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchBlogsList, removeBlogAction } from '@/app/actions/blogActions';
import { Plus, Edit2, Trash2, Globe, FileText, Loader2, Search } from 'lucide-react';
import { BlogPost } from '@/data/blogService';

export default function BlogManager() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    setLoading(true);
    const data = await fetchBlogsList();
    setBlogs(data || []);
    setLoading(false);
  };

  const handleDelete = async (slug: string) => {
    if (confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
      const res = await removeBlogAction(slug);
      if (res.success) {
        setBlogs(blogs.filter(b => b.slug !== slug));
      } else {
        alert(res.error || 'Failed to delete');
      }
    }
  };

  const filteredBlogs = blogs.filter(
    (b) => b.title.toLowerCase().includes(search.toLowerCase()) || b.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-secondary">Manage <span className="text-primary">Blogs</span></h1>
          <p className="text-secondary/60 font-medium">Create, edit, and organize your publications.</p>
        </div>
        
        <Link
          href="/admin/write"
          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-[0_8px_20px_rgb(52,211,153,0.3)] transition-all"
        >
          <Plus size={20} />
          Write New Blog
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 min-h-[500px]">
        
        {/* Toolbar */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles by title or category..."
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white text-secondary font-medium transition-all"
            />
          </div>
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary/40" />
            <p className="font-medium animate-pulse">Loading publications...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-gray-400">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-bold text-secondary mb-2">No blogs found</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">You haven't written anything matching this or your portfolio is empty.</p>
            <Link href="/admin/write" className="text-primary font-bold hover:underline">
              Start your first publication
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-50">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-secondary border-b border-gray-100">
                  <th className="py-4 px-6 font-bold">Title</th>
                  <th className="py-4 px-6 font-bold">Category</th>
                  <th className="py-4 px-6 font-bold">Status</th>
                  <th className="py-4 px-6 font-bold">Date</th>
                  <th className="py-4 px-6 font-bold text-right border-l border-gray-100/50">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredBlogs.map((blog) => (
                  <tr key={blog.slug} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-5 px-6">
                      <div className="font-bold text-secondary truncate max-w-[300px] mb-1">
                        {blog.title}
                      </div>
                      <div className="text-xs text-gray-400 truncate max-w-[300px]">
                        {blog.excerpt?.substring(0, 50)}...
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-secondary/5 text-secondary">
                        {blog.category}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      {blog.status === 'published' ? (
                        <div className="flex items-center gap-1.5 text-primary text-sm font-bold bg-primary/10 px-3 py-1 rounded-full w-fit">
                          <Globe size={14} /> Published
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-orange-500 text-sm font-bold bg-orange-500/10 px-3 py-1 rounded-full w-fit">
                          <FileText size={14} /> Draft
                        </div>
                      )}
                    </td>
                    <td className="py-5 px-6 text-sm text-gray-500 font-medium whitespace-nowrap">
                      {new Date(blog.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-5 px-6 text-right border-l border-gray-50">
                      <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/admin/write?slug=${blog.slug}`}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(blog.slug)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
