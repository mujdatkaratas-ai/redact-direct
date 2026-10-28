import React from 'react';
import LegalPage, { Section, SubSection } from '@/components/LegalPage';
import { COMPANY } from '@/lib/config';

const DPA: React.FC = () => (
  <LegalPage title="Data Processing Agreement (Article 28 UK GDPR)">
    <p>
      This Data Processing Agreement ("DPA") forms part of the agreement between you (the "Client" or
      "Data Controller") and {COMPANY.name} ("we", "us", "Processor"), a trading name of {COMPANY.parentCompany}.
      It is provided in accordance with UK GDPR Article 28 and applies to all redaction services we provide.
    </p>

    <Section title="1. Scope and Purpose">
      <p>
        This DPA covers the processing of personal data by us on behalf of the Client in the course of
        providing document redaction services. We process personal data only on the Client's documented
        instructions and for the sole purpose of delivering the redaction service.
      </p>
    </Section>

    <Section title="2. Nature of Processing">
      <SubSection title="2.1 Types of personal data">
        <p>
          Documents, files, images, video, and media uploaded by the Client for the purpose of redaction.
          This may include names, addresses, email content, safeguarding records, medical information,
          personnel files, legal correspondence, financial information, and any other personal data
          contained in the uploaded material.
        </p>
      </SubSection>
      <SubSection title="2.2 Categories of data subjects">
        <p>
          Any individuals whose personal data is contained in the documents uploaded by the Client,
          including but not limited to: pupils, parents, staff, complainants, witnesses, members of the
          public, and third parties referenced in the documents.
        </p>
      </SubSection>
      <SubSection title="2.3 Purpose">
        <p>
          Redaction of personal data from documents prior to disclosure by the Client in response to
          SARs, FOI requests, EIR requests, or for any other lawful purpose instructed by the Client.
        </p>
      </SubSection>
      <SubSection title="2.4 Duration">
        <p>
          For the duration of each redaction job. Files are retained for 30 days after the redacted pack
          is marked as ready, after which they are permanently deleted. Job metadata is retained for 6
          years for audit purposes.
        </p>
      </SubSection>
    </Section>

    <Section title="3. Our Obligations">
      <p>We shall:</p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li>Process personal data only on the Client's documented instructions</li>
        <li>Not process personal data for any other purpose, including not for our own purposes</li>
        <li>Ensure that all persons authorised to process personal data are subject to confidentiality obligations</li>
        <li>Implement appropriate technical and organisational measures (see Section 5)</li>
        <li>Assist the Client in responding to enquiries from data subjects and supervisory authorities</li>
        <li>Notify the Client without undue delay (and in any event within 72 hours) of any personal data breach</li>
        <li>Assist the Client in meeting obligations under UK GDPR Articles 32–36</li>
        <li>Delete or return all personal data upon completion of the job and after the 30-day retention period</li>
        <li>Make available information necessary to demonstrate compliance with this DPA</li>
        <li>Allow and contribute to audits, subject to reasonable notice (at least 14 days)</li>
      </ul>
    </Section>

    <Section title="4. What We Will Not Do">
      <p>We shall NOT:</p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li>Send the Client's documents to any external AI provider (OpenAI, Google, AWS, Anthropic, or any other)</li>
        <li>Use any cloud-based AI or machine learning service to process the Client's data</li>
        <li>Transfer personal data outside the United Kingdom without the Client's prior written consent</li>
        <li>Engage any sub-processor without the Client's prior written authorisation (see Section 6)</li>
        <li>Retain personal data beyond the 30-day retention period</li>
        <li>Use personal data for training, testing, or improving any AI model or software system</li>
      </ul>
    </Section>

    <Section title="5. Security Measures — Air-Gapped Processing">
      <SubSection title="5.1 Air gap">
        <p>
          Personal data is processed in an air-gapped environment — a controlled system with no network
          connection to external AI services. Documents are uploaded through an encrypted portal, processed
          on infrastructure that has no connection to external AI providers, and the finished pack is
          returned through the same encrypted channel. At no point does the data leave our control or
          pass through a third party.
        </p>
      </SubSection>
      <SubSection title="5.2 Technical measures">
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Encryption in transit (TLS 1.3) and at rest (AES-256)</li>
          <li>Authenticated access via email and per-job access tokens</li>
          <li>Signed upload and download URLs (time-limited)</li>
          <li>No external network connection during redaction processing</li>
        </ul>
      </SubSection>
      <SubSection title="5.3 Organisational measures">
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Confidentiality obligations for all personnel</li>
          <li>Human review on every page before it leaves us</li>
          <li>Download audit trail: who, when, and which file</li>
          <li>Access removed in seconds when required</li>
          <li>Deletion verified, not promised</li>
        </ul>
      </SubSection>
    </Section>

    <Section title="6. Sub-Processors">
      <p>We use the following sub-processors:</p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li><strong>Vercel Inc.</strong> — website hosting and CDN. DPA available on request. SOC 2 Type II certified.</li>
        <li><strong>Supabase Inc.</strong> — database, file storage, serverless functions. Data in eu-west-2 (London). SOC 2 Type II certified.</li>
        <li><strong>Stripe Inc.</strong> — payment processing. PCI DSS compliant. No card data seen by us.</li>
      </ul>
      <p>
        We remain liable for the acts and omissions of our sub-processors to the same extent as if we
        were performing the services directly. We will not engage any new sub-processor without notifying
        the Client in advance and giving the Client the opportunity to object.
      </p>
    </Section>

    <Section title="7. International Transfers">
      <p>
        All processing takes place within the United Kingdom. Data is hosted in the eu-west-2 (London)
        region. We shall not transfer personal data outside the UK without the Client's prior written
        consent and, where required, an International Data Transfer Agreement (IDTA) or UK Addendum to
        Standard Contractual Clauses.
      </p>
    </Section>

    <Section title="8. Data Subject Rights">
      <p>
        We shall assist the Client in responding to requests from data subjects exercising their rights
        under UK GDPR Articles 15–22, including: right of access, right to rectification, right to erasure,
        right to restriction, and right to data portability. We will provide the Client with any
        information necessary to demonstrate compliance within a reasonable time of request.
      </p>
    </Section>

    <Section title="9. Breach Notification">
      <p>
        We shall notify the Client without undue delay (and in any event within 72 hours) of becoming
        aware of a personal data breach. The notification shall include:
      </p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li>The nature of the breach</li>
        <li>The categories and approximate number of data subjects affected</li>
        <li>The likely consequences</li>
        <li>The measures taken or proposed to address the breach and mitigate its effects</li>
      </ul>
      <p>
        We shall cooperate with the Client and the ICO in any investigation of a breach.
      </p>
    </Section>

    <Section title="10. Deletion and Return">
      <p>
        Upon completion of a redaction job, the redacted pack is available for download for 30 days.
        After 30 days, all files (original uploads and redacted packs) are permanently deleted.
        Deletion is verified. Upon the Client's request, we shall delete all personal data immediately
        rather than retaining it for the 30-day period.
      </p>
      <p>
        Job metadata (reference, date, status, service type, price) is retained for 6 years for audit
        purposes and does not contain personal data from the Client's documents.
      </p>
    </Section>

    <Section title="11. Audit">
      <p>
        The Client may audit our compliance with this DPA, provided it gives at least 14 days' notice
        and conducts the audit in a manner that does not disrupt our operations. We will make available
        all relevant records and information necessary to demonstrate compliance.
      </p>
    </Section>

    <Section title="12. Liability">
      <p>
        Our liability under this DPA shall be limited to the fees paid by the Client for the redaction
        job(s) in question, unless the breach was caused by our intentional misconduct or gross negligence.
      </p>
    </Section>

    <Section title="13. Contact">
      <p>
        For all matters relating to this DPA, contact us at {COMPANY.email}.
      </p>
    </Section>
  </LegalPage>
);

export default DPA;
