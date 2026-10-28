import React from 'react';
import LegalPage, { Section, SubSection } from '@/components/LegalPage';
import { COMPANY } from '@/lib/config';

const Privacy: React.FC = () => (
  <LegalPage title="Privacy Policy">
    <p>
      {COMPANY.name} ("we", "us", "our") is a trading name of {COMPANY.parentCompany}. We provide
      secure document redaction services for organisations responding to Subject Access Requests (SARs),
      Freedom of Information (FOI) requests, and Environmental Information Regulations (EIR) requests.
    </p>
    <p>
      This Privacy Policy explains how we collect, use, store, and protect personal data in connection
      with our services, in accordance with the UK General Data Protection Regulation (UK GDPR) and the
      Data Protection Act 2018 (DPA 2018).
    </p>

    <Section title="1. Data Controller and Data Processor">
      <p>
        When you engage our services, you (the "Client") are the Data Controller and we are the Data
        Processor. We process personal data on your documented instructions only, for the purpose of
        redacting personal data from documents before disclosure.
      </p>
      <p>
        If you are an individual whose personal data appears in documents submitted to us for redaction
        by an organisation, that organisation is the Data Controller. We process your personal data on
        their instructions, not ours.
      </p>
    </Section>

    <Section title="2. Personal Data We Process">
      <SubSection title="2.1 Personal data you provide to us">
        <p>When you create a redaction job through our portal, we collect:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Your email address (used to identify your jobs and contact you)</li>
          <li>A description of the redaction work required</li>
          <li>The service type selected and price paid</li>
          <li>Documents and files you upload for redaction</li>
        </ul>
      </SubSection>
      <SubSection title="2.2 Personal data contained in uploaded documents">
        <p>
          Documents uploaded for redaction may contain personal data belonging to data subjects — names,
          addresses, email addresses, phone numbers, financial information, medical information,
          safeguarding records, and other personal data. We process this data solely for the purpose of
          identifying and redacting it, as instructed by the Data Controller.
        </p>
      </SubSection>
      <SubSection title="2.3 Technical data">
        <p>
          We collect basic technical data automatically when you use our website: IP address (via our
          hosting provider), browser type, and pages visited. This is used for security, service
          maintenance, and analytics.
        </p>
      </SubSection>
    </Section>

    <Section title="3. Lawful Basis for Processing">
      <p>We rely on the following lawful bases under UK GDPR Article 6:</p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li><strong>Article 6(1)(b)</strong> — Performance of a contract: processing your personal data (email, job details) to deliver the redaction service you have paid for.</li>
        <li><strong>Article 6(1)(c)</strong> — Legal obligation: processing personal data in documents as necessary to comply with our obligations as a data processor under the Data Controller's instructions and applicable law.</li>
        <li><strong>Article 6(1)(f)</strong> — Legitimate interests: collecting technical data for security and service improvement, balanced against your rights and expectations.</li>
      </ul>
      <p>
        For special categories of personal data (Article 9), such as health information or safeguarding
        records that may appear in uploaded documents, we process such data on the basis of
        Article 9(2)(b) — necessary for the establishment, exercise or defence of legal claims —
        and Article 9(2)(g) — substantial public interest — as the documents are being redacted for
        lawful disclosure under data protection legislation.
      </p>
    </Section>

    <Section title="4. How We Use Your Personal Data">
      <p>We use your personal data for the following purposes:</p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li>To create and manage redaction jobs</li>
        <li>To process payments through our payment provider (Stripe)</li>
        <li>To communicate with you about your job status</li>
        <li>To identify and remove personal data from documents as instructed</li>
        <li>To maintain an audit trail of processing activities</li>
        <li>To provide the redacted pack for download</li>
      </ul>
      <p>
        We do <strong>not</strong> use your personal data for: marketing, profiling, automated
        decision-making, training AI models, or any purpose other than delivering the redaction service.
      </p>
    </Section>

    <Section title="5. Air-Gapped Processing — No Cloud AI">
      <p>
        A core principle of our service is that your documents are processed in an air-gapped environment.
        This means:
      </p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li>No external AI provider (OpenAI, Google, AWS, Anthropic, or any other) processes your documents</li>
        <li>Redaction is performed on infrastructure that has no network connection to external AI services</li>
        <li>No cloud-based machine learning model sees your documents</li>
        <li>AI-assisted identification, where used, runs locally and is subject to human review on every page</li>
        <li>Your data never leaves our control during processing</li>
      </ul>
      <p>
        This is the difference between "we use AI" and "we use AI, but your data never leaves our control."
      </p>
    </Section>

    <Section title="6. Data Sharing and Recipients">
      <p>We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
      <SubSection title="6.1 Sub-processors">
        <p>We engage the following sub-processors to deliver our services:</p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li><strong>Vercel Inc.</strong> — website hosting and content delivery (CDN). Data Processing Agreement in place. SOC 2 Type II certified.</li>
          <li><strong>Supabase Inc.</strong> — database hosting, file storage, and serverless functions. Data hosted in eu-west-2 (London). SOC 2 Type II certified.</li>
          <li><strong>Stripe Inc.</strong> — payment processing. PCI DSS compliant. We never see or store your card details.</li>
        </ul>
        <p>
          We do not engage any sub-processor without ensuring appropriate safeguards are in place, including
          a written agreement that meets the requirements of UK GDPR Article 28(2).
        </p>
      </SubSection>
      <SubSection title="6.2 Law enforcement and regulatory">
        <p>
          We may disclose personal data if required to do so by law, court order, or regulatory authority
          (including the Information Commissioner's Office). We will challenge any request that appears
          disproportionate or unlawful.
        </p>
      </SubSection>
    </Section>

    <Section title="7. International Transfers">
      <p>
        Your personal data is stored and processed within the United Kingdom. Our hosting providers
        (Vercel and Supabase) may have personnel outside the UK who provide infrastructure support.
      </p>
      <p>
        Where any access to personal data occurs from outside the UK, appropriate safeguards are in
        place, including Standard Contractual Clauses (SCCs) or the UK International Data Transfer
        Agreement (IDTA), as required by UK GDPR Articles 44–49.
      </p>
      <p>
        Payment processing via Stripe may involve transfers to Stripe's global infrastructure. Stripe
        maintains its own DPA and appropriate transfer mechanisms.
      </p>
    </Section>

    <Section title="8. Data Retention">
      <SubSection title="8.1 Uploaded documents and redacted packs">
        <p>
          Original files uploaded by clients and redacted packs are retained for <strong>30 days</strong>
          after the redacted pack is marked as "ready". After 30 days, all files are permanently deleted
          from our storage. Deletion is verified, not promised.
        </p>
      </SubSection>
      <SubSection title="8.2 Job metadata">
        <p>
          We retain a record of each job (reference number, date, status, service type, price) for
          <strong> 6 years</strong> for accounting and audit purposes. This metadata does not contain
          personal data from your documents.
        </p>
      </SubSection>
      <SubSection title="8.3 Account information">
        <p>
          Your email address is retained for as long as you have active jobs. You may request deletion
          of your email address and all associated data at any time by contacting us.
        </p>
      </SubSection>
      <SubSection title="8.4 Early deletion">
        <p>
          Upon request, we will delete all personal data immediately, rather than retaining it for the
          30-day period. Contact us at {COMPANY.email} to request immediate deletion.
        </p>
      </SubSection>
    </Section>

    <Section title="9. Security Measures">
      <p>
        We implement appropriate technical and organisational measures to ensure a level of security
        appropriate to the risk, in accordance with UK GDPR Article 32:
      </p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li><strong>Encryption in transit:</strong> All data is transmitted over TLS 1.3</li>
        <li><strong>Encryption at rest:</strong> All stored files are encrypted (AES-256)</li>
        <li><strong>Access control:</strong> Portal access is authenticated by email and per-job access tokens</li>
        <li><strong>Air-gapped processing:</strong> No network connection to external AI services during redaction</li>
        <li><strong>Human review:</strong> Every page of every document is reviewed by a person before it leaves us</li>
        <li><strong>Deletion verification:</strong> Files are verified as deleted after the retention period</li>
        <li><strong>Download audit trail:</strong> Every download is recorded — who, when, and which file</li>
        <li><strong>Access revocation:</strong> Access can be revoked in seconds</li>
      </ul>
    </Section>

    <Section title="10. Your Rights Under UK GDPR">
      <p>You have the following rights under the UK GDPR:</p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li><strong>Right of access (Article 15):</strong> You can request a copy of the personal data we hold about you</li>
        <li><strong>Right to rectification (Article 16):</strong> You can ask us to correct inaccurate personal data</li>
        <li><strong>Right to erasure (Article 17):</strong> You can ask us to delete your personal data</li>
        <li><strong>Right to restriction (Article 18):</strong> You can ask us to restrict processing in certain circumstances</li>
        <li><strong>Right to data portability (Article 20):</strong> You can receive your personal data in a structured, machine-readable format</li>
        <li><strong>Right to object (Article 21):</strong> You can object to processing based on legitimate interests</li>
        <li><strong>Rights related to automated decision-making (Article 22):</strong> You have the right not to be subject to solely automated decisions</li>
      </ul>
      <p>
        To exercise any of these rights, contact us at {COMPANY.email}. We will respond within one month
        of receiving your request, as required by UK GDPR Article 12(3).
      </p>
      <p>
        If you are not satisfied with our response, you have the right to complain to the Information
        Commissioner's Office (ICO) at <a href="https://ico.org.uk" className="text-slate-900 underline">ico.org.uk</a> or by calling 0303 123 1113.
      </p>
    </Section>

    <Section title="11. Breach Notification">
      <p>
        In the event of a personal data breach, we will notify the Data Controller without undue delay
        and in any event within 72 hours of becoming aware of the breach, in accordance with UK GDPR
        Article 33. We will cooperate with the Data Controller and the ICO in any investigation.
      </p>
      <p>
        The notification will include: the nature of the breach, the categories and approximate number
        of data subjects affected, the likely consequences, and the measures taken or proposed to
        address the breach and mitigate its effects.
      </p>
    </Section>

    <Section title="12. Cookies">
      <p>
        Our website uses essential cookies for authentication and session management. We use Google
        Analytics to understand how visitors use our site. Google Analytics uses cookies to collect
        anonymised usage data. You can control cookies through your browser settings.
      </p>
      <p>
        For full details, see our <a href="/cookies" className="text-slate-900 underline">Cookie Policy</a>.
      </p>
    </Section>

    <Section title="13. Children's Data">
      <p>
        We do not knowingly process personal data of children under 18. However, documents uploaded for
        redaction may contain personal data relating to children (e.g., safeguarding records in school
        SAR responses). Such data is processed solely for the purpose of redaction, as instructed by the
        Data Controller, and is deleted after 30 days or upon request.
      </p>
    </Section>

    <Section title="14. Changes to This Policy">
      <p>
        We may update this Privacy Policy from time to time. The "Last updated" date at the top of this
        page indicates when the most recent changes were made. We will notify you of any material changes
        by email or by posting a notice on our website.
      </p>
    </Section>

    <Section title="15. Contact">
      <p>
        For any questions about this Privacy Policy or our data processing practices, contact us:
      </p>
      <ul className="list-none pl-0 space-y-1 mt-2">
        <li><strong>Email:</strong> {COMPANY.email}</li>
        <li><strong>Web:</strong> {COMPANY.domain}</li>
        <li><strong>Company:</strong> {COMPANY.name}, a trading name of {COMPANY.parentCompany}</li>
      </ul>
      <p className="mt-4">
        You may also contact the Information Commissioner's Office: <a href="https://ico.org.uk" className="text-slate-900 underline">ico.org.uk</a>, telephone 0303 123 1113.
      </p>
    </Section>
  </LegalPage>
);

export default Privacy;
