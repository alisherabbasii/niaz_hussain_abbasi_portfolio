import { useEffect, useState } from 'react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    // Process headings in the article after render
    const elements = Array.from(document.querySelectorAll('.prose h2, .prose h3'));
    
    // Assign IDs if not present and collect items
    const items = elements.map((elem) => {
      if (!elem.id) {
        elem.id = elem.textContent?.toLowerCase().replace(/\s+/g, '-') || Math.random().toString();
      }
      return {
        id: elem.id,
        text: elem.textContent || '',
        level: Number(elem.tagName.charAt(1))
      };
    });
    
    setHeadings(items);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    }, { rootMargin: '-20% 0% -80% 0%' });

    elements.forEach(elem => observer.observe(elem));
    return () => observer.disconnect();
  }, []);

  if (headings.length === 0) return null;

  return (
    <div className="bg-gray-50 rounded-2xl p-6 mb-10 border border-gray-100">
      <h4 className="font-bold text-secondary mb-4 uppercase tracking-wider text-sm">Table of Contents</h4>
      <nav className="space-y-2">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={`block text-sm transition-all ${
              heading.level === 3 ? 'ml-4' : ''
            } ${
              activeId === heading.id 
                ? 'text-primary font-bold line-clamp-2' 
                : 'text-secondary/70 hover:text-primary font-medium line-clamp-1'
            }`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' });
              setActiveId(heading.id);
            }}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </div>
  );
}
