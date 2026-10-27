import React from 'react';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

let GA_MEASUREMENT_ID = '';

export function setAnalyticsId(id: string) {
  GA_MEASUREMENT_ID = id;
}

export function trackPageView(path: string) {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;
  if (window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, { page_path: path });
  }
}

export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value,
    });
  }
}

export function getAnalyticsScript(): string {
  if (!GA_MEASUREMENT_ID) return '';
  return `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
}
