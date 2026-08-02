'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { BlogPost } from '@/data/blogService';

interface BlogCardProps {
  blog: BlogPost;
  index: number;
}

export default function BlogCard({ blog, index }: BlogCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -5 }}
      className="group flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      <div className="p-8 flex flex-col flex-1 relative">
        <div className="flex items-center justify-between mb-6">
          <span className="px-4 py-1.5 bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider rounded-full">
            {blog.category}
          </span>
          <div className="flex items-center gap-4 text-xs font-semibold text-secondary/50">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {new Date(blog.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {blog.readTime}
            </span>
          </div>
        </div>

        <Link href={`/blog/${blog.slug}`} className="group-hover:text-primary transition-colors">
          <h3 className="text-2xl font-bold text-secondary mb-4 leading-snug">
            {blog.title}
          </h3>
        </Link>
        
        <p className="text-secondary/70 leading-relaxed mb-8 flex-1">
          {blog.excerpt}
        </p>

        <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-100">
          <span className="text-sm font-bold text-secondary">
            By {blog.author}
          </span>
          <Link
            href={`/blog/${blog.slug}`}
            className="flex items-center gap-2 text-primary font-bold hover:text-accent transition-colors text-sm uppercase tracking-wide"
          >
            Read Article <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
