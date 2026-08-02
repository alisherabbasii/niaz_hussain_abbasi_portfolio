import { getBlogBySlug, getBlogs } from '@/data/blogService';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Clock, Tag } from 'lucide-react';
import ShareButtons from '@/components/blog/ShareButtons';
import TableOfContents from '@/components/blog/TableOfContents';
import BlogSEO from '@/components/blog/BlogSEO';
import Image from 'next/image';

// Fallback to static generation for all existing slugs
export async function generateStaticParams() {
  const blogs = await getBlogs();
  // Only pre-build published blogs
  return blogs.filter(b => b.status === 'published').map((post) => ({
    slug: post.slug,
  }));
}

// NextJS auto-generates SEO metadata based on this export
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);
  if (!blog) return { title: 'Not Found' };

  return {
    title: `${blog.title} | Sohail Hanif Abbasi`,
    description: blog.excerpt,
    alternates: {
      canonical: `/blog/${blog.slug}`,
    },
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      images: blog.featuredImage ? [blog.featuredImage] : [],
      type: 'article',
      publishedTime: blog.date,
      authors: [blog.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description: blog.excerpt,
      images: blog.featuredImage ? [blog.featuredImage] : [],
    }
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog || blog.status === 'draft') {
    notFound();
  }

  // Find related posts (same category, not same slug)
  const allBlogs = await getBlogs();
  const relatedPosts = allBlogs
    .filter(b => b.status === 'published' && b.category === blog.category && b.slug !== blog.slug)
    .slice(0, 2);

  return (
    <main className="min-h-screen bg-background-custom flex flex-col">
      <BlogSEO blog={blog} />
      <Navbar />

      <article className="flex-grow pt-32 pb-24 relative">
        {/* Header */}
        <header className="max-w-4xl mx-auto px-6 mb-16 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-secondary hover:text-primary hover:border-primary/30 rounded-full font-semibold transition-all mb-10 shadow-sm"
          >
            <ArrowLeft size={18} /> Back to Journals
          </Link>

          <div className="mb-8">
            <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent font-bold uppercase tracking-wider text-sm rounded-full mb-6 relative">
              <span className="absolute inset-0 bg-accent/20 animate-pulse rounded-full" />
              {blog.category}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-5xl font-black text-secondary leading-[1.2] mb-8 max-w-3xl mx-auto">
              {blog.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm md:text-base font-medium text-secondary/60">
              <span className="flex items-center gap-2">
                <User size={18} className="text-primary" />
                {blog.author}
              </span>
              <span className="flex items-center gap-2">
                <Calendar size={18} className="text-primary" />
                {new Date(blog.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-2">
                <Clock size={18} className="text-primary" />
                {blog.readTime}
              </span>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Main article body */}
          <div className="lg:col-span-12">
            <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">

              {blog.featuredImage && (
                <div className="w-full h-[300px] sm:h-[400px] rounded-3xl overflow-hidden mb-10 relative">
                  <Image
                    src={blog.featuredImage}
                    alt={blog.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              )}

              {/* Lead paragraph */}
              <p className="text-xl md:text-2xl text-secondary/80 font-medium leading-relaxed mb-10 text-justify">
                {blog.excerpt}
              </p>

              <hr className="border-gray-100 mb-10" />

              <div
                className="prose prose-lg prose-emerald max-w-none text-secondary/80 leading-loose prose-headings:font-black prose-headings:text-secondary prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-2xl prose-img:shadow-sm"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />

              <div className="mt-10 flex flex-wrap gap-2">
                {blog.tags?.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-100 text-secondary/70 rounded-lg text-sm font-medium">
                    <Tag size={12} /> {tag}
                  </span>
                ))}
              </div>

              <ShareButtons title={blog.title} slug={blog.slug} />

              <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gray-50 rounded-3xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center text-primary font-bold text-xl uppercase border-2 border-white shadow-md flex-shrink-0">
                    SA
                  </div>
                  <div>
                    <p className="font-bold text-secondary">Written by {blog.author}</p>
                    <p className="text-sm text-secondary/60">Community Leader & Spiritual Student</p>
                  </div>
                </div>

                <Link
                  href="/blog"
                  className="px-6 py-3 bg-white border border-gray-100 text-secondary hover:border-primary/50 hover:text-primary font-bold rounded-xl transition-all whitespace-nowrap shadow-sm"
                >
                  All Articles
                </Link>
              </div>
            </div>
          </div>

          {/* Sticky Sidebar Right */}
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-24">
              <TableOfContents />

              {relatedPosts.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mt-8">
                  <h4 className="font-bold text-secondary mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
                    Related Articles
                  </h4>
                  <div className="space-y-4">
                    {relatedPosts.map(rp => (
                      <Link key={rp.slug} href={`/blog/${rp.slug}`} className="block group">
                        <div className="text-xs text-primary font-bold mb-1">{rp.category}</div>
                        <h5 className="font-bold text-secondary text-sm group-hover:text-primary transition-colors line-clamp-2">
                          {rp.title}
                        </h5>
                        <div className="text-xs text-secondary/50 mt-1 flex items-center gap-2">
                          <span>{rp.readTime}</span> • <span>{new Date(rp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </article>

      <Footer />
    </main>
  );
}
