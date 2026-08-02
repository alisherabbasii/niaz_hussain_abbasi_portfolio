import { Share2, Link2, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const TwitterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
  </svg>
);

const LinkedinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

export default function ShareButtons({ title, slug }: { title: string, slug: string }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 py-6 border-y border-gray-100 my-10">
      <div className="flex items-center gap-2 text-secondary/60 font-bold text-sm uppercase tracking-wider">
        <Share2 size={16} /> Share Article:
      </div>
      <div className="flex gap-2">
        <a 
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          target="_blank" rel="noopener noreferrer"
          className="w-10 h-10 rounded-full bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-all"
        >
          <FacebookIcon />
        </a>
        <a 
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
          target="_blank" rel="noopener noreferrer"
          className="w-10 h-10 rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2] flex items-center justify-center hover:bg-[#1DA1F2] hover:text-white transition-all"
        >
          <TwitterIcon />
        </a>
        <a 
          href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`}
          target="_blank" rel="noopener noreferrer"
          className="w-10 h-10 rounded-full bg-[#0A66C2]/10 text-[#0A66C2] flex items-center justify-center hover:bg-[#0A66C2] hover:text-white transition-all"
        >
          <LinkedinIcon />
        </a>
        <a 
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + url)}`}
          target="_blank" rel="noopener noreferrer"
          className="w-10 h-10 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all"
        >
          {/* using link2 for whatsapp outline simply because lucide has no whatsapp icon sometimes easily fetched */}
          <Link2 size={18} />
        </a>
        <button 
          onClick={copyLink}
          className="w-10 h-10 rounded-full bg-gray-100 text-secondary flex items-center justify-center hover:bg-secondary hover:text-white transition-all ml-4"
        >
          {copied ? <Check size={18} className="text-green-500" /> : <Link2 size={18} />}
        </button>
      </div>
    </div>
  );
}
