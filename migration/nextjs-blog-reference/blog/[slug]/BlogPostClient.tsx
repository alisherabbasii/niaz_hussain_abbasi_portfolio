'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Tag, ArrowRight } from 'lucide-react';
import type { BlogPost } from '@/data/blogService';

interface BlogPostClientProps {
  post: BlogPost;
  relatedPosts: BlogPost[];
}

export default function BlogPostClient({ post, relatedPosts }: BlogPostClientProps) {
  // Simple markdown-to-html: headings, bold, italic, lists, paragraphs
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let listBuffer: string[] = [];
    let listType: 'ul' | 'ol' | null = null;

    const flushList = () => {
      if (listBuffer.length > 0 && listType) {
        const ListTag = listType;
        elements.push(
          <ListTag
            key={`list-${elements.length}`}
            className={`mb-6 space-y-2 ${listType === 'ul' ? 'list-disc' : 'list-decimal'} list-inside text-secondary/70 text-lg leading-relaxed`}
          >
            {listBuffer.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ListTag>
        );
        listBuffer = [];
        listType = null;
      }
    };

    lines.forEach((line, i) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushList();
        return;
      }

      // Ordered list
      if (/^\d+\.\s/.test(trimmed)) {
        if (listType !== 'ol') flushList();
        listType = 'ol';
        listBuffer.push(trimmed.replace(/^\d+\.\s/, ''));
        return;
      }

      // Unordered list
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (listType !== 'ul') flushList();
        listType = 'ul';
        listBuffer.push(trimmed.slice(2));
        return;
      }

      flushList();

      // H2
      if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="text-2xl md:text-3xl font-bold text-secondary mt-12 mb-6">
            {trimmed.slice(3)}
          </h2>
        );
        return;
      }

      // H3
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="text-xl md:text-2xl font-bold text-secondary mt-10 mb-4">
            {trimmed.slice(4)}
          </h3>
        );
        return;
      }

      // Italic paragraph (starts with *)
      if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
        elements.push(
          <p key={i} className="text-lg text-primary italic font-medium mb-6">
            {trimmed.slice(1, -1)}
          </p>
        );
        return;
      }

      // Inline bold (**text**)
      const processInline = (text: string) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-bold text-secondary">{part.slice(2, -2)}</strong>;
          }
          return part;
        });
      };

      // Regular paragraph
      elements.push(
        <p key={i} className="text-lg text-secondary/70 leading-relaxed mb-6">
          {processInline(trimmed)}
        </p>
      );
    });

    flushList();
    return elements;
  };

  return (
    <main className="min-h-screen bg-background-custom">
      {/* Header */}
      <div className="bg-secondary text-white">
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 md:py-20">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-white/60 hover:text-accent transition-colors font-medium mb-8"
          >
            <ArrowLeft size={18} /> Back to Blog
          </Link>

          <div className="flex items-center gap-4 mb-6">
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-white/50 uppercase tracking-widest">
              <Calendar size={14} />
              {new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-widest ${
                post.category === 'Military'
                  ? 'text-green-400'
                  : post.category === 'Welfare'
                    ? 'text-accent'
                    : 'text-blue-400'
              }`}
            >
              <Tag size={14} />
              {post.category}
            </span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold leading-tight"
          >
            {post.title}
          </motion.h1>
        </div>
      </div>

      {/* Content */}
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="max-w-4xl mx-auto px-6 md:px-12 py-12 md:py-16"
      >
        <div className="bg-white rounded-[40px] p-8 md:p-14 shadow-sm border border-gray-100">
          {renderContent(post.content)}
        </div>
      </motion.article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 md:px-12 pb-20">
          <h3 className="text-2xl font-bold text-secondary mb-8">More Articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {relatedPosts.map((related) => (
              <Link key={related.slug} href={`/blog/${related.slug}`}>
                <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group h-full">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-widest mb-4">
                    <Tag size={12} />
                    {related.category}
                  </span>
                  <h4 className="text-lg font-bold text-secondary mb-3 group-hover:text-primary transition-colors">
                    {related.title}
                  </h4>
                  <p className="text-secondary/60 text-sm leading-relaxed mb-4">
                    {related.excerpt}
                  </p>
                  <span className="inline-flex items-center gap-2 text-primary font-bold text-sm group-hover:gap-3 transition-all">
                    Read More <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
