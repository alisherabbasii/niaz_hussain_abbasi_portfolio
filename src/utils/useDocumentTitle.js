import { useEffect } from 'react';

const SITE_NAME = 'Niaz Hussain Abbasi';

/** Sets document.title for the current route and restores it on unmount. */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
