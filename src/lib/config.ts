// Redact Direct — pricing and service configuration.

/** Per-job pricing (in pence) + Stripe price IDs. */
export const PRICING = {
  documentRedaction: { label: 'Document redaction', price: 7500, stripePriceId: 'price_1UV90mD8BaLTPam5fzRKrHtE', desc: 'Emails, records, personnel files — per job' },
  sarRedaction: { label: 'Full SAR redaction', price: 25000, stripePriceId: 'price_1UV92GD8BaLTPam5A8KfhEG4', desc: 'Complete subject access request pack — per job' },
  complexSar: { label: 'Complex safeguarding SAR', price: 50000, stripePriceId: 'price_1UV93LD8BaLTPam5hDeiVlwL', desc: 'Safeguarding records, multi-party, sensitive material — per job' },
  cctvRedaction: { label: 'CCTV redaction', price: 1000, stripePriceId: null, desc: 'Per minute of footage — blur faces, remove identifiers' },
  managedSar: { label: 'Fully managed SAR', price: 75000, stripePriceId: 'price_1UV94hD8BaLTPam5AicpOhhA', desc: 'We handle the entire request: collection, redaction, exemption advice, disclosure pack' },
} as const;

export const COMPANY = {
  name: 'Redact Direct',
  legalName: 'Redact Direct',
  parentCompany: 'ELF Gate Limited',
  tagline: 'Secure Redaction. Confident Disclosure.',
  email: 'support@redactdirect.co.uk',
  phone: '07912 089 262',
  phoneDisplay: '07912 089 262',
  url: 'https://redactdirect.co.uk',
  domain: 'redactdirect.co.uk',
  icoNumber: 'Z', // TODO: fill in ELF Gate Limited ICO registration number
  companyNumber: '', // TODO: fill in ELF Gate Companies House number if needed
};

export const PRICING_TABLE = [
  { ...PRICING.documentRedaction, id: 'document', unit: 'per job' },
  { ...PRICING.sarRedaction, id: 'sar', unit: 'per job' },
  { ...PRICING.complexSar, id: 'complex', unit: 'per job' },
  { ...PRICING.cctvRedaction, id: 'cctv', unit: 'per minute' },
  { ...PRICING.managedSar, id: 'managed', unit: 'per job' },
];

/** Stripe price IDs for each service tier (null = no fixed price, e.g. CCTV per-minute). */
export const STRIPE_PRICE_IDS: Record<string, string | null> = {
  document: PRICING.documentRedaction.stripePriceId,
  sar: PRICING.sarRedaction.stripePriceId,
  complex: PRICING.complexSar.stripePriceId,
  cctv: PRICING.cctvRedaction.stripePriceId,
  managed: PRICING.managedSar.stripePriceId,
};

/** Stripe publishable key (safe for the browser). */
export const STRIPE_PUBLISHABLE_KEY =
  'pk_live_51U0aReD8BaLTPam5zRiR2h1EyKv4U2fREi3JqZKj1Gdn4brkM6SYYAo2rrsbnxzT5eiWA8jXdqNXaXKmyzjX2bvi00jwNXUDGo';

export function formatPence(pence: number): string {
  return `£${(pence / 100).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
