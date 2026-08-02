'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { fetchBlogsList } from '@/app/actions/blogActions';
import { BlogPost } from '@/data/blogService';
import BlogCard from './BlogCard';
import { useLanguage } from '@/i18n/LanguageContext';
import Link from 'next/link';
import { LibraryBig, ArrowRight, Loader2 } from 'lucide-react';

export default function BlogSection() {
  const [featuredBlogs, setFeaturedBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchBlogsList();
      const published = data.filter(b => b.status === 'published' && b.featured).slice(0, 3);
      setFeaturedBlogs(published);
      setLoading(false);
    };
    loadData();
  }, []);

  return (
    <section id="blog" className="section-padding bg-background-custom bg-gradient-to-b from-white to-primary/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-primary font-semibold text-sm shadow-sm border border-primary/10 mb-6"
            >
              <LibraryBig size={16} className="text-accent" />
              Latest Articles
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-4 tracking-tight">
              Featured <span className="text-primary italic">Writings</span>
            </h2>
            <p className="text-lg text-secondary/60">
              Reflections on spiritual knowledge, life lessons, and balancing technical discipline with inner peace.
            </p>
          </div>
          <Link
            href="/blog"
            className="group flex items-center justify-center gap-2 px-8 py-4 bg-white border border-gray-100 text-secondary font-bold rounded-xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
          >
            View All Journals
            <ArrowRight size={20} className="text-primary group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-primary opacity-50" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredBlogs.map((blog, index) => (
              <BlogCard key={blog.slug} blog={blog} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
