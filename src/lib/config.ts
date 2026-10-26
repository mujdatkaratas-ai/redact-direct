// Redact Direct — pricing and service configuration.

/** Per-job pricing (in pence). */
export const PRICING = {
  documentRedaction: { label: 'Document redaction', price: 7500, desc: 'Emails, records, personnel files — per job' },
  sarRedaction: { label: 'Full SAR redaction', price: 25000, desc: 'Complete subject access request pack — per job' },
  complexSar: { label: 'Complex safeguarding SAR', price: 75000, desc: 'Safeguarding records, multi-party, sensitive material — per job' },
  cctvRedaction: { label: 'CCTV redaction', price: 1000, desc: 'Per minute of footage — blur faces, remove identifiers' },
  managedSar: { label: 'Fully managed SAR', price: 75000, desc: 'We handle the entire request: collection, redaction, exemption advice, disclosure pack' },
} as const;

export const COMPANY = {
  name: 'Redact Direct',
  legalName: 'Redact Direct',
  parentCompany: 'ELF Gate Limited',
  tagline: 'Secure Redaction. Confident Disclosure.',
  email: 'admin@redactdirect.co.uk',
  phone: '',
  url: 'https://redactdirect.co.uk',
  domain: 'redactdirect.co.uk',
};

export const PRICING_TABLE = [
  { ...PRICING.documentRedaction, id: 'document', unit: 'per job' },
  { ...PRICING.sarRedaction, id: 'sar', unit: 'per job' },
  { ...PRICING.complexSar, id: 'complex', unit: 'per job' },
  { ...PRICING.cctvRedaction, id: 'cctv', unit: 'per minute' },
  { ...PRICING.managedSar, id: 'managed', unit: 'per job' },
];

export function formatPence(pence: number): string {
  return `£${(pence / 100).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
