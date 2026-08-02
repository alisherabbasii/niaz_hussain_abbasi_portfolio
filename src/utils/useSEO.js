import { useEffect } from 'react';

const SITE_NAME = 'Niaz Hussain Abbasi';

function createMeta(attr, key, content) {
  const el = document.createElement('meta');
  el.setAttribute(attr, key);
  el.setAttribute('content', content);
  document.head.appendChild(el);
  return el;
}

function createCanonicalLink(href) {
  const el = document.createElement('link');
  el.setAttribute('rel', 'canonical');
  el.setAttribute('href', href);
  document.head.appendChild(el);
  return el;
}

function createJsonLdScript(schema) {
  const el = document.createElement('script');
  el.type = 'application/ld+json';
  el.textContent = JSON.stringify(schema);
  document.head.appendChild(el);
  return el;
}

/**
 * Single source of truth for per-page document metadata: title, description,
 * canonical URL, Open Graph, Twitter Card, and JSON-LD structured data
 * (pass one schema object or an array of them via `jsonLd`).
 *
 * This is a client-only SPA with no SSR/prerendering (same tradeoff
 * `useDocumentTitle` already made) — search engines that execute JS will see
 * these tags, but crawlers that don't render JS (most social-share link
 * previews) won't. Elements are created fresh on mount and fully removed on
 * unmount/re-run, since only one routed page is ever mounted at a time.
 */
export function useSEO({
  title,
  description,
  path,
  image,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  jsonLd,
}) {
  useEffect(() => {
    const previousTitle = document.title;
    const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
    document.title = fullTitle;

    const url = `${window.location.origin}${path ?? window.location.pathname}`;

    const tagDefs = [
      description && ['name', 'description', description],
      ['property', 'og:site_name', SITE_NAME],
      ['property', 'og:type', type],
      ['property', 'og:title', fullTitle],
      description && ['property', 'og:description', description],
      ['property', 'og:url', url],
      image && ['property', 'og:image', image],
      ['name', 'twitter:card', image ? 'summary_large_image' : 'summary'],
      ['name', 'twitter:title', fullTitle],
      description && ['name', 'twitter:description', description],
      image && ['name', 'twitter:image', image],
      type === 'article' && author && ['property', 'article:author', author],
      type === 'article' && publishedTime && ['property', 'article:published_time', publishedTime],
      type === 'article' && modifiedTime && ['property', 'article:modified_time', modifiedTime],
    ].filter(Boolean);

    const createdElements = tagDefs.map(([attr, key, content]) => createMeta(attr, key, content));
    createdElements.push(createCanonicalLink(url));

    if (jsonLd) {
      const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      schemas.forEach((schema) => createdElements.push(createJsonLdScript(schema)));
    }

    return () => {
      document.title = previousTitle;
      createdElements.forEach((el) => el.remove());
    };
  }, [title, description, path, image, type, publishedTime, modifiedTime, author, jsonLd]);
}
