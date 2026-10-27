import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_ID = 'G-PLACEHOLDER';

export default function PageTracker() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined' || !window.gtag) return;
    window.gtag('config', GA_ID, {
      page_path: pathname + search,
    });
  }, [pathname, search]);

  return null;
}
