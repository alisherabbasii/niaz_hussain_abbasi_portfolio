"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveBlogAction, fetchBlogAction } from '@/app/actions/saveBlogAction';
import RichTextEditor from './RichTextEditor';
import slugify from 'slugify';
import { ArrowLeft, Upload, Loader2, Save, Send } from 'lucide-react';
import Link from 'next/link';

export default function BlogEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editSlug = searchParams.get('slug');

  const [loading, setLoading] = useState(!!editSlug);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: '',
    tags: '',
    excerpt: '',
    content: '',
    author: 'Sohail Hanif Abbasi', // Hardcoded default
    featured: false,
    status: 'draft' as 'draft' | 'published',
    featuredImage: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editSlug) {
      loadBlog(editSlug);
    }
  }, [editSlug]);

  const loadBlog = async (slug: string) => {
    try {
      const blog = await fetchBlogAction(slug);
      if (blog) {
        setFormData({
          title: blog.title,
          slug: blog.slug,
          category: blog.category,
          tags: blog.tags ? blog.tags.join(', ') : '',
          excerpt: blog.excerpt,
          content: blog.content,
          author: blog.author,
          featured: blog.featured || false,
          status: blog.status,
          featuredImage: blog.featuredImage || ''
        });
        if (blog.featuredImage) setImagePreview(blog.featuredImage);
      }
    } catch {
      setError('Could not load blog for editing.');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      // Only auto-slug if it's not a saved edit
      ...( !editSlug && { slug: slugify(title, { lower: true, strict: true }) } )
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show instant preview
    setImagePreview(URL.createObjectURL(file));

    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setFormData(prev => ({ ...prev, featuredImage: data.url }));
      }
    } catch (err) {
      alert('Image upload failed.');
    }
  };

  const calculateReadTime = (text: string) => {
    const wordsPerMinute = 200;
    const cleanText = text.replace(/<[^>]*>?/gm, ''); // Remove HTML tags
    const words = cleanText.split(/\s+/).length;
    const time = Math.ceil(words / wordsPerMinute);
    return `${time} min read`;
  };

  const submitForm = async (publishStatus: 'draft' | 'published') => {
    setSaving(true);
    setError('');

    if (!formData.title || !formData.slug || !formData.content) {
      setError('Title, Slug, and Content are required fields.');
      setSaving(false);
      return;
    }

    const payload = {
      ...formData,
      status: publishStatus,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      date: editSlug ? undefined : new Date().toISOString(), // Only set date on create, updateBlog handles updated date
      readTime: calculateReadTime(formData.content)
    };

    if (editSlug) {
      // Retain original date
      const existingBlog = await fetchBlogAction(editSlug);
      if (existingBlog) Object.assign(payload, { date: existingBlog.date });
    }

    const res = await saveBlogAction(payload as any, !!editSlug);

    if (res.success) {
      router.push('/admin/blogs');
    } else {
      setError(res.error || 'Failed to save blog.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto pb-32">
      <Link href="/admin/blogs" className="inline-flex items-center gap-2 text-secondary/60 hover:text-primary mb-8 font-medium transition-colors">
        <ArrowLeft size={16} /> Back to Blogs
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-black text-secondary">
          {editSlug ? 'Edit' : 'Write'} <span className="text-primary">Blog</span>
        </h1>

        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => submitForm('draft')}
            disabled={saving}
            className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-gray-200 text-secondary hover:border-primary/50 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Save size={18} /> Save Draft
          </button>
          <button 
            onClick={() => submitForm('published')}
            disabled={saving}
            className="flex-1 md:flex-none px-6 py-2.5 bg-primary text-white hover:bg-primary/90 font-bold rounded-xl shadow-[0_4px_15px_rgb(52,211,153,0.3)] transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /> Publish</>}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-8 flex items-center gap-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-secondary ml-1">Title</label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={handleTitleChange}
              className="w-full px-4 py-3 border border-gray-100 rounded-xl bg-white text-lg font-bold text-secondary focus:ring-2 focus:ring-primary/20 focus:border-primary/50" 
              placeholder="E.g. The Power of Consistency" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-secondary ml-1">Excerpt / Meta Description</label>
            <textarea 
              value={formData.excerpt} 
              onChange={e => setFormData({...formData, excerpt: e.target.value})}
              rows={3}
              className="w-full px-4 py-3 border border-gray-100 rounded-xl bg-white text-secondary focus:ring-2 focus:ring-primary/20 focus:border-primary/50 resize-none" 
              placeholder="A brief summary for the homepage and SEO metadata..." 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-secondary ml-1">Content</label>
            {/* Force unmount/remount on initial load to pass content safely */}
            <RichTextEditor 
              content={formData.content} 
              onChange={val => setFormData({...formData, content: val})} 
            />
          </div>
        </div>

        {/* Sidebar Configuration */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
            <h3 className="font-bold text-secondary border-b border-gray-100 pb-3">Document Settings</h3>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary ml-1">URL Slug</label>
              <input 
                type="text" 
                value={formData.slug} 
                onChange={e => setFormData({...formData, slug: e.target.value})}
                className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-50 text-sm text-secondary focus:ring-2 focus:ring-primary/20" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary ml-1">Category</label>
              <select 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select Category...</option>
                <option value="Sufism">Sufism</option>
                <option value="Leadership">Leadership</option>
                <option value="Life Lessons">Life Lessons</option>
                <option value="Spiritual Thoughts">Spiritual Thoughts</option>
                <option value="Community">Community</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary ml-1">Tags (Comma separated)</label>
              <input 
                type="text" 
                value={formData.tags} 
                onChange={e => setFormData({...formData, tags: e.target.value})}
                placeholder="tech, religion, self-help"
                className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-50 text-sm text-secondary focus:ring-2 focus:ring-primary/20" 
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="featured"
                checked={formData.featured}
                onChange={e => setFormData({...formData, featured: e.target.checked})}
                className="rounded border-gray-300 text-primary focus:ring-primary/40 h-4 w-4"
              />
              <label htmlFor="featured" className="text-sm font-bold text-secondary cursor-pointer">
                Feature on Homepage
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-secondary border-b border-gray-100 pb-3">Featured Image</h3>
            
            {imagePreview ? (
              <div className="space-y-3">
                <img src={imagePreview} alt="Preview" className="w-full h-auto rounded-xl object-cover" />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-xs font-bold py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-secondary"
                >
                  Change Image
                </button>
              </div>
            ) : (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-gray-200 hover:border-primary/50 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors group"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Upload size={18} />
                </div>
                <span className="text-sm font-medium text-secondary/70">Click to upload</span>
              </button>
            )}
            
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleImageUpload} 
            />
          </div>
        </div>

      </div>
    </div>
  );
}
