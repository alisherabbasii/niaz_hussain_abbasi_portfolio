import { Share2, Link2, Check } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

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

export default function ShareButtons({
  title,
  slug,
  description,
}: {
  title: string;
  slug: string;
  description?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    // The currently-open blog's own URL — never the homepage, blog listing,
    // or a hardcoded path — so every platform below shares exactly the
    // article the visitor is reading.
    setUrl(window.location.href);
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, [slug]);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [url]);

  const nativeShare = useCallback(() => {
    navigator
      .share({ title, text: description || title, url })
      // The user dismissing the native share sheet also rejects this
      // promise — nothing to surface as an error in that case.
      .catch(() => {});
  }, [title, description, url]);

  const whatsappText = description ? `${title}\n\n${description}\n\nRead more:\n${url}` : `${title}\n\n${url}`;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 py-6 border-y border-gray-100 my-10">
      <div className="flex items-center gap-2 text-secondary/60 font-bold text-sm uppercase tracking-wider">
        <Share2 size={16} /> Share Article:
      </div>
      <div className="flex items-center gap-2">
        {canNativeShare && (
          <button
            type="button"
            onClick={nativeShare}
            aria-label="Share"
            className="w-10 h-10 rounded-full bg-accent/10 text-accent-strong flex items-center justify-center hover:bg-accent-strong hover:text-white transition-all"
          >
            <Share2 size={18} />
          </button>
        )}
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          target="_blank" rel="noopener noreferrer"
          aria-label="Share on Facebook"
          className="w-10 h-10 rounded-full bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-all"
        >
          <FacebookIcon />
        </a>
        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
          target="_blank" rel="noopener noreferrer"
          aria-label="Share on X (Twitter)"
          className="w-10 h-10 rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2] flex items-center justify-center hover:bg-[#1DA1F2] hover:text-white transition-all"
        >
          <TwitterIcon />
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
          target="_blank" rel="noopener noreferrer"
          aria-label="Share on LinkedIn"
          className="w-10 h-10 rounded-full bg-[#0A66C2]/10 text-[#0A66C2] flex items-center justify-center hover:bg-[#0A66C2] hover:text-white transition-all"
        >
          <LinkedinIcon />
        </a>
        <a
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`}
          target="_blank" rel="noopener noreferrer"
          aria-label="Share on WhatsApp"
          className="w-10 h-10 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all"
        >
          {/* using link2 for whatsapp outline simply because lucide has no whatsapp icon sometimes easily fetched */}
          <Link2 size={18} />
        </a>
        <div className="relative ml-4">
          <button
            onClick={copyLink}
            aria-label="Copy link"
            className="w-10 h-10 rounded-full bg-gray-100 text-secondary flex items-center justify-center hover:bg-secondary hover:text-white transition-all"
          >
            {copied ? <Check size={18} className="text-green-500" /> : <Link2 size={18} />}
          </button>
          <span
            role="status"
            aria-live="polite"
            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-white shadow-sm transition-opacity z-10 ${
              copied ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            Link copied successfully.
          </span>
        </div>
      </div>
    </div>
  );
}
