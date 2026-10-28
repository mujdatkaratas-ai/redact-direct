import React from 'react';
import LegalPage, { Section } from '@/components/LegalPage';
import { COMPANY } from '@/lib/config';

const Cookies: React.FC = () => (
  <LegalPage title="Cookie Policy">
    <p>
      This Cookie Policy explains how {COMPANY.name} ("we", "us") uses cookies and similar technologies
      when you visit our website at {COMPANY.domain}. It is provided in accordance with the Privacy and
      Electronic Communications Regulations (PECR) and the UK GDPR.
    </p>

    <Section title="1. What Are Cookies?">
      <p>
        Cookies are small text files stored on your device when you visit a website. They allow the
        website to remember your actions and preferences over a period of time. Cookies are widely
        used to make websites work more efficiently and to provide information to site owners.
      </p>
    </Section>

    <Section title="2. Cookies We Use">
      <p>We use the following categories of cookies:</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs border border-slate-200">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="text-left px-4 py-2">Cookie</th>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-left px-4 py-2">Purpose</th>
              <th className="text-left px-4 py-2">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="px-4 py-2 font-semibold">rd_access_tokens</td>
              <td className="px-4 py-2">Essential</td>
              <td className="px-4 py-2">Stores your job access tokens in localStorage so you can view and manage your jobs</td>
              <td className="px-4 py-2">Until cleared from browser</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-semibold">_ga</td>
              <td className="px-4 py-2">Analytics</td>
              <td className="px-4 py-2">Google Analytics — distinguishes unique visitors</td>
              <td className="px-4 py-2">2 years</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-semibold">_ga_*</td>
              <td className="px-4 py-2">Analytics</td>
              <td className="px-4 py-2">Google Analytics — maintains session state</td>
              <td className="px-4 py-2">2 years</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-semibold">__stripe_mid</td>
              <td className="px-4 py-2">Essential</td>
              <td className="px-4 py-2">Stripe — fraud prevention during checkout</td>
              <td className="px-4 py-2">1 year</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-semibold">__stripe_sid</td>
              <td className="px-4 py-2">Essential</td>
              <td className="px-4 py-2">Stripe — session management during checkout</td>
              <td className="px-4 py-2">30 minutes</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Section>

    <Section title="3. Essential Cookies">
      <p>
        Essential cookies are necessary for the website to function. Without them, you cannot create
        jobs, upload files, or download redacted packs. These cookies do not require consent under PECR.
      </p>
      <p>
        The <code className="bg-slate-100 px-1 rounded">rd_access_tokens</code> value is stored in
        localStorage (not a cookie) and contains the access tokens that allow you to view and manage
        your jobs. It is not shared with any third party.
      </p>
    </Section>

    <Section title="4. Analytics Cookies">
      <p>
        We use Google Analytics to understand how visitors use our website. Google Analytics uses
        cookies to collect anonymised data about how you found the site, which pages you visited, and
        how long you stayed. This data is aggregated and does not identify you personally.
      </p>
      <p>
        Google Analytics is configured with IP anonymisation. Data is processed by Google LLC under
        Google's Data Processing Agreement. For more information, see
        <a href="https://policies.google.com/technologies/partner-sites" className="text-slate-900 underline"> Google's privacy policy</a>.
      </p>
    </Section>

    <Section title="5. Stripe Cookies">
      <p>
        When you make a payment, Stripe sets cookies for fraud prevention and session management.
        Stripe is PCI DSS compliant and we never see or store your card details. For more information,
        see <a href="https://stripe.com/cookies" className="text-slate-900 underline">Stripe's cookie policy</a>.
      </p>
    </Section>

    <Section title="6. Managing Cookies">
      <p>
        You can control and delete cookies through your browser settings. Each browser has different
        instructions for managing cookies:
      </p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li><a href="https://support.google.com/chrome/answer/95647" className="text-slate-900 underline">Google Chrome</a></li>
        <li><a href="https://support.microsoft.com/en-us/help/17442/windows-internet-explorer-delete-manage-cookies" className="text-slate-900 underline">Microsoft Edge</a></li>
        <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" className="text-slate-900 underline">Mozilla Firefox</a></li>
        <li><a href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac" className="text-slate-900 underline">Apple Safari</a></li>
      </ul>
      <p>
        Disabling essential cookies may prevent you from using the client portal. Disabling analytics
        cookies will not affect the functionality of the website.
      </p>
    </Section>

    <Section title="7. Do We Use Third-Party Cookies?">
      <p>
        Yes — Google Analytics and Stripe set cookies on our site. However, we do not allow
        advertising cookies, retargeting cookies, or social media tracking cookies on our website.
      </p>
    </Section>

    <Section title="8. Changes to This Policy">
      <p>
        We may update this Cookie Policy from time to time. The "Last updated" date indicates when the
        most recent changes were made.
      </p>
    </Section>

    <Section title="9. Contact">
      <p>
        For any questions about our use of cookies, contact us at {COMPANY.email}.
      </p>
    </Section>
  </LegalPage>
);

export default Cookies;
