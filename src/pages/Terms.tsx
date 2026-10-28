import React from 'react';
import LegalPage, { Section, SubSection } from '@/components/LegalPage';
import { COMPANY, formatPence, PRICING_TABLE } from '@/lib/config';

const Terms: React.FC = () => (
  <LegalPage title="Terms of Service">
    <p>
      These Terms of Service ("Terms") govern your use of {COMPANY.name} ("we", "us", "our"), a trading
      name of {COMPANY.parentCompany}. By using our services, you agree to these Terms.
    </p>

    <Section title="1. Definitions">
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li><strong>"Client"</strong> — the organisation or individual engaging our services</li>
        <li><strong>"Data Controller"</strong> — the Client, who determines the purposes and means of processing personal data</li>
        <li><strong>"Data Processor"</strong> — {COMPANY.name}, acting on the Client's instructions</li>
        <li><strong>"Job"</strong> — a single redaction request created through our portal</li>
        <li><strong>"Documents"</strong> — files uploaded by the Client for redaction</li>
        <li><strong>"Redacted Pack"</strong> — the finished output after redaction, returned to the Client</li>
        <li><strong>"UK GDPR"</strong> — the UK General Data Protection Regulation as it forms part of English law</li>
      </ul>
    </Section>

    <Section title="2. Our Role and Your Role">
      <p>
        We act as a Data Processor on your instructions. You are the Data Controller and retain
        responsibility for:
      </p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li>Establishing the lawful basis for processing and disclosure</li>
        <li>Determining what exemptions apply and what should be redacted</li>
        <li>Ensuring the disclosure of the redacted pack is lawful</li>
        <li>Providing accurate and complete instructions to us</li>
        <li>Ensuring you have the right to share the documents with us</li>
      </ul>
      <p>
        We provide redaction services and may advise on exemptions, but the final decision on what to
        disclose is yours. We are not liable for personal data that we were not instructed to redact,
        or for decisions made by you on what to disclose.
      </p>
    </Section>

    <Section title="3. Services">
      <p>We provide the following redaction services:</p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        {PRICING_TABLE.map((p) => (
          <li key={p.id}><strong>{p.label}</strong> — {formatPence(p.price)} {p.unit}</li>
        ))}
      </ul>
      <p>
        CCTV redaction is priced per minute of footage. Complex or safeguarding jobs may carry a higher
        fee based on volume and sensitivity — we will confirm any additional cost before proceeding.
      </p>
    </Section>

    <Section title="4. Pricing and Payment">
      <SubSection title="4.1 Per-job pricing">
        <p>
          Each job is priced individually. You will see the price before payment. Payment is taken
          through Stripe at the time of job creation. No work begins until payment is received.
        </p>
      </SubSection>
      <SubSection title="4.2 Refunds">
        <p>
          If you cancel a job before uploading any documents, we will refund the full amount. If you
          cancel after uploading documents but before redaction has begun, we will refund less a 25%
          administration fee. No refund is available after redaction has begun.
        </p>
      </SubSection>
      <SubSection title="4.3 VAT">
        <p>All prices exclude VAT. VAT is added at the applicable rate at checkout.</p>
      </SubSection>
    </Section>

    <Section title="5. Air-Gapped Processing">
      <p>
        A key term of our service is that all redaction is performed in an air-gapped environment:
      </p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li>No external AI provider (OpenAI, Google, AWS, Anthropic, or any other) processes your documents</li>
        <li>Redaction runs on infrastructure with no network connection to external AI services</li>
        <li>No cloud model sees your documents</li>
        <li>Every page is reviewed by a person before it leaves us</li>
        <li>Files are deleted 30 days after the redacted pack is marked as ready</li>
      </ul>
    </Section>

    <Section title="6. Data Processing Agreement (Article 28)">
      <p>
        We will enter into a written Data Processing Agreement with any Client who requires one, in
        accordance with UK GDPR Article 28. Our standard DPA is available on request and covers:
      </p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li>The subject matter and duration of processing</li>
        <li>The nature and purpose of processing</li>
        <li>The types of personal data and categories of data subjects</li>
        <li>The obligations and rights of the Data Controller</li>
        <li>Sub-processors (Vercel, Supabase, Stripe)</li>
        <li>Security measures (encryption, access control, air-gapped processing)</li>
        <li>Breach notification (72 hours)</li>
        <li>Audit rights</li>
        <li>Deletion and return of data</li>
      </ul>
    </Section>

    <Section title="7. Data Security">
      <p>
        We implement appropriate technical and organisational measures to ensure a level of security
        appropriate to the risk, including encryption in transit and at rest, access controls, air-gapped
        processing, human review, and deletion verification. See our <a href="/privacy" className="text-slate-900 underline">Privacy Policy</a> for full details.
      </p>
    </Section>

    <Section title="8. Data Retention">
      <p>
        Original documents and redacted packs are retained for 30 days after the pack is marked as
        "ready". After 30 days, all files are permanently deleted. Job metadata (reference, date,
        status, price) is retained for 6 years for accounting and audit purposes.
      </p>
      <p>
        You may request immediate deletion at any time by contacting us at {COMPANY.email}.
      </p>
    </Section>

    <Section title="9. Intellectual Property">
      <p>
        You retain all intellectual property rights in the documents you upload. We do not claim
        ownership of your documents. The redacted pack is returned to you and you may use it for your
        intended disclosure purpose.
      </p>
    </Section>

    <Section title="10. Confidentiality">
      <p>
        We treat all documents and information you share with us as confidential. Our personnel are
        subject to confidentiality obligations. We will not disclose your documents or information to
        any third party except as required by law or as necessary to deliver the service (e.g., our
        hosting providers, who are bound by their own confidentiality obligations).
      </p>
    </Section>

    <Section title="11. Limitation of Liability">
      <p>
        We take reasonable care to redact personal data accurately. Every page is reviewed by a human.
        However, our liability is limited to the fee paid for the specific job in question, unless:
      </p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li>The loss was caused by our intentional misconduct or gross negligence</li>
        <li>The loss was caused by a breach of our security obligations under UK GDPR Article 32</li>
        <li>Otherwise required by law (including liability for death or personal injury caused by negligence)</li>
      </ul>
      <p>
        We are not liable for: personal data we were not instructed to redact, decisions made by you on
        what to disclose, indirect or consequential losses, loss of profit, or loss of business.
      </p>
    </Section>

    <Section title="12. Indemnity">
      <p>
        You indemnify us against any claims arising from your instructions to us, including claims that
        we were instructed to redact material that should not have been redacted, or claims arising from
        the disclosure of the redacted pack by you.
      </p>
    </Section>

    <Section title="13. Cancellation and Termination">
      <p>
        You may cancel a job before uploading documents for a full refund. After upload, cancellation
        is subject to a 25% administration fee if redaction has not begun. No cancellation is available
        after redaction has begun.
      </p>
      <p>
        We may terminate or suspend services if you breach these Terms, if we suspect unlawful use,
        or if required by law. Upon termination, all data will be deleted in accordance with our
        retention policy.
      </p>
    </Section>

    <Section title="14. Governing Law and Jurisdiction">
      <p>
        These Terms are governed by the laws of England and Wales. Any disputes arising from these
        Terms or our services will be subject to the exclusive jurisdiction of the courts of England
        and Wales.
      </p>
    </Section>

    <Section title="15. Changes to These Terms">
      <p>
        We may update these Terms from time to time. The "Last updated" date indicates when the most
        recent changes were made. Continued use of our services after changes constitutes acceptance
        of the updated Terms.
      </p>
    </Section>

    <Section title="16. Contact">
      <p>For any questions about these Terms, contact us:</p>
      <ul className="list-none pl-0 space-y-1 mt-2">
        <li><strong>Email:</strong> {COMPANY.email}</li>
        <li><strong>Web:</strong> {COMPANY.domain}</li>
        <li><strong>Company:</strong> {COMPANY.name}, a trading name of {COMPANY.parentCompany}</li>
      </ul>
    </Section>
  </LegalPage>
);

export default Terms;
