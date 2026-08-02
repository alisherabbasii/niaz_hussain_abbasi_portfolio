import { BlogPost } from '@/data/blogService';
import Script from 'next/script';

export default function BlogSEO({ blog }: { blog: BlogPost }) {
  const websiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sohailhanifabbasi.com';
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    image: blog.featuredImage ? [`${websiteUrl}${blog.featuredImage}`] : [],
    datePublished: new Date(blog.date).toISOString(),
    dateModified: blog.updatedAt ? new Date(blog.updatedAt).toISOString() : new Date(blog.date).toISOString(),
    author: [{
        '@type': 'Person',
        name: blog.author,
        url: websiteUrl
    }],
    description: blog.excerpt,
    articleBody: blog.content.replace(/<[^>]*>?/gm, ''), // Stripped text
  };

  return (
    <Script
      id="blog-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
