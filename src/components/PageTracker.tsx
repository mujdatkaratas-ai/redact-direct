import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_ID = 'G-122FTBLJJX';

export default function PageTracker() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined' || !window.gtag) return;
    // Send only the pathname — never the query string, which may contain
    // email addresses, session IDs, or other PII.
    window.gtag('config', GA_ID, {
      page_path: pathname,
    });
  }, [pathname]);

  return null;
}
