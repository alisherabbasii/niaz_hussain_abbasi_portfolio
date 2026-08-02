import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { getBlogs } from '@/data/blogService';
import { ArrowRight, Calendar, User, Clock, FileText } from 'lucide-react';
import Image from 'next/image';

export const metadata = {
  title: 'Journals & Thoughts | Sohail Hanif Abbasi',
  description: 'Read the latest thoughts, lessons, and spiritual reflections by Sohail Hanif Abbasi.',
};

export default async function BlogPage() {
  const allBlogs = await getBlogs();
  const publishedBlogs = allBlogs.filter((b) => b.status === "published");

  return (
    <main className="min-h-screen bg-background-custom flex flex-col">
      <Navbar />

      <section className="flex-grow pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent font-bold uppercase tracking-wider text-sm rounded-full mb-6 relative">
              <span className="absolute inset-0 bg-accent/20 animate-pulse rounded-full" />
              Writings
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-secondary leading-[1.15] mb-6">
              Journals & <span className="text-primary italic">Thoughts</span>
            </h1>
            <p className="text-lg md:text-xl text-secondary/60 font-medium">
              Reflections on leadership, spirituality, community service, and personal growth.
            </p>
          </div>

          {publishedBlogs.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl bg-white max-w-3xl mx-auto">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <FileText size={24} />
              </div>
              <h3 className="text-xl font-bold text-secondary mb-2">No Articles Yet</h3>
              <p className="text-gray-500 max-w-sm mx-auto">Check back later for new reflections and spiritual insights.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {publishedBlogs.map((blog, idx) => (
                <article
                  key={blog.slug}
                  className="relative bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col group hover:-translate-y-2 transition-transform duration-300"
                >
                  {blog.featuredImage ? (
                    <div className="w-full h-48 rounded-2xl overflow-hidden relative mb-6">
                      <Image
                        src={blog.featuredImage}
                        alt={blog.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) :
                    <>
                      <div className="w-full h-48 rounded-2xl overflow-hidden relative mb-6">
                        <Image

                          src={`https://placehold.net/7-800x600.png`}
                          alt={blog.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    </>}

                  <div className="flex items-center gap-3 text-xs font-bold text-secondary/60 mb-4 uppercase tracking-wider">
                    <span className="text-accent">{blog.category}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="flex items-center gap-1.5"><Clock size={12} /> {blog.readTime}</span>
                  </div>

                  <h2 className="text-2xl font-black text-secondary leading-tight mb-4 group-hover:text-primary transition-colors line-clamp-2">
                    <Link href={`/blog/${blog.slug}`}>
                      {blog.title}
                      <span className="absolute inset-0"></span>
                    </Link>
                  </h2>

                  <p className="text-secondary/70 mb-6 flex-grow line-clamp-3 leading-relaxed">
                    {blog.excerpt}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-auto relative z-10">
                    <div className="flex items-center gap-2 text-sm font-bold text-secondary">
                      <User size={16} className="text-primary" />
                      {blog.author}
                    </div>
                    <Link
                      href={`/blog/${blog.slug}`}
                      className="w-10 h-10 rounded-full bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors"
                    >
                      <ArrowRight size={18} className="group-hover:-rotate-45 transition-transform" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
