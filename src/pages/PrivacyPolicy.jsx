import React, { useState } from "react";
import { ChevronDown, ChevronUp, Shield, Lock, Eye, Database, Globe, Phone, Mail, AlertTriangle, Scale, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const Section = ({ icon: Icon, title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-100 text-base">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-6 py-5 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
          {children}
        </div>
      )}
    </div>
  );
};

const Clause = ({ number, title, children }) => (
  <div className="mb-3">
    <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{number}. {title}</p>
    <div className="pl-4 border-l-2 border-emerald-100 dark:border-emerald-800">{children}</div>
  </div>
);

const DataRow = ({ category, examples, purpose, basis }) => (
  <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-4 mb-3">
    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-1">{category}</p>
    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1"><span className="font-medium">Examples:</span> {examples}</p>
    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1"><span className="font-medium">Purpose:</span> {purpose}</p>
    <p className="text-xs text-slate-500 dark:text-slate-400"><span className="font-medium">Legal basis:</span> {basis}</p>
  </div>
);

export default function PrivacyPolicy() {
  const effectiveDate = "26 March 2026";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-full px-4 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-4">
            <Lock className="w-3.5 h-3.5" /> Privacy Document
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Privacy Policy</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <strong>BwanguSpares</strong> · Effective Date: {effectiveDate}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Operated by Ikhumbi-Tech Center · Flat 15C Kalewa Complex, Ndola, Zambia
          </p>
        </div>

        {/* Intro Banner */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-2xl p-5 mb-6 flex gap-3">
          <Shield className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-800 dark:text-emerald-200">
            At BwanguSpares, your privacy matters. This Privacy Policy explains how we collect, use, store, and protect your personal data in compliance with the <strong>Data Protection Act No. 3 of 2021</strong> of the Republic of Zambia. By using our platform, you acknowledge this policy.
          </p>
        </div>

        {/* Section 1 */}
        <Section icon={Database} title="1. Who We Are (Data Controller)" defaultOpen={true}>
          <p>
            <strong>Ikhumbi-Tech Center</strong> ("we", "us", "our") is the Data Controller responsible for your personal data as defined under the Data Protection Act No. 3 of 2021. We operate the BwanguSpares online marketplace for auto spare parts in Zambia.
          </p>
          <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-4 mt-2 text-sm space-y-1">
            <p><strong>Company:</strong> Ikhumbi-Tech Center</p>
            <p><strong>Address:</strong> Flat 15C Kalewa Complex, Ndola, Zambia</p>
            <p><strong>Email:</strong> <a href="mailto:admin@bwangu.com" className="text-emerald-600 dark:text-emerald-400 hover:underline">admin@bwangu.com</a></p>
            <p><strong>Phone:</strong> <a href="tel:+260773247860" className="text-emerald-600 dark:text-emerald-400 hover:underline">+260 773 247 860</a></p>
          </div>
        </Section>

        {/* Section 2 */}
        <Section icon={Eye} title="2. What Personal Data We Collect">
          <p className="mb-3">We collect only the data necessary to provide our marketplace services:</p>
          <DataRow
            category="Identity Data"
            examples="Full name, username, profile photo"
            purpose="Account creation and identification"
            basis="Contractual necessity"
          />
          <DataRow
            category="Contact Data"
            examples="Email address, phone number, physical address"
            purpose="Order delivery, notifications, customer support"
            basis="Contractual necessity & legitimate interests"
          />
          <DataRow
            category="Transaction Data"
            examples="Purchase history, payment records, order details"
            purpose="Processing orders, payouts, and refunds"
            basis="Contractual necessity & legal obligation"
          />
          <DataRow
            category="Technical Data"
            examples="IP address, browser type, device info, usage logs"
            purpose="Security monitoring, fraud prevention, platform improvement"
            basis="Legitimate interests"
          />
          <DataRow
            category="Location Data"
            examples="Town/region, GPS coordinates (if permitted)"
            purpose="Finding nearby shops, delivery routing"
            basis="Consent"
          />
          <DataRow
            category="Business Data (Shop Owners)"
            examples="Business registration number, tax ID, bank/mobile money details"
            purpose="Shop verification and payout processing"
            basis="Contractual necessity & legal obligation"
          />
          <Clause number="2.1" title="Sensitive Data">
            We do not intentionally collect sensitive personal data (e.g., health data, racial/ethnic origin, political opinions). If such data is inadvertently submitted, it will be deleted promptly.
          </Clause>
          <Clause number="2.2" title="Children's Data">
            BwanguSpares is not intended for persons under 18 years of age. We do not knowingly collect data from minors. If we become aware that a minor has registered, we will delete their account immediately.
          </Clause>
        </Section>

        {/* Section 3 */}
        <Section icon={Globe} title="3. How We Collect Your Data">
          <Clause number="3.1" title="Directly from You">
            When you register an account, place an order, register a shop, submit a review, contact support, or communicate with other users on the platform.
          </Clause>
          <Clause number="3.2" title="Automatically">
            Through cookies, server logs, and analytics tools when you browse or interact with the platform.
          </Clause>
          <Clause number="3.3" title="From Third Parties">
            From payment processors (Stripe, MTN MoMo, NGenius) to confirm transactions; from Google Sign-In if you use that login method; from logistics partners for delivery updates.
          </Clause>
          <Clause number="3.4" title="Cookies">
            We use essential cookies to keep you logged in and maintain your session. We use analytics cookies to understand how users interact with the platform. You may disable non-essential cookies in your browser settings. Disabling essential cookies may affect platform functionality.
          </Clause>
        </Section>

        {/* Section 4 */}
        <Section icon={Shield} title="4. How We Use Your Personal Data">
          <p className="mb-3">We use your personal data strictly for the following purposes:</p>
          <ul className="list-disc pl-4 space-y-1.5">
            <li><strong>Account Management:</strong> Creating, managing, and securing your account</li>
            <li><strong>Order Fulfilment:</strong> Processing purchases, arranging delivery, and handling returns</li>
            <li><strong>Payments:</strong> Processing payments and disbursing payouts to shops</li>
            <li><strong>Communications:</strong> Sending order updates, notifications, and customer support responses</li>
            <li><strong>Platform Safety:</strong> Detecting and preventing fraud, abuse, and security threats</li>
            <li><strong>Legal Compliance:</strong> Meeting our obligations under Zambian law including tax and financial record-keeping</li>
            <li><strong>Service Improvement:</strong> Analysing usage patterns to improve the platform (using anonymised/aggregated data where possible)</li>
            <li><strong>Marketing:</strong> Sending promotional communications where you have given explicit consent (you may opt out at any time)</li>
          </ul>
          <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              We will never use your personal data for purposes incompatible with those stated above without obtaining your prior consent.
            </p>
          </div>
        </Section>

        {/* Section 5 */}
        <Section icon={Globe} title="5. Sharing Your Personal Data">
          <Clause number="5.1" title="We Never Sell Your Data">
            BwanguSpares does not sell, rent, or trade your personal data to any third party for marketing or commercial purposes.
          </Clause>
          <Clause number="5.2" title="Trusted Service Providers">
            We share data only with carefully selected partners who process it strictly on our behalf:
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              <li><strong>Stripe</strong> — Payment processing (PCI-DSS compliant)</li>
              <li><strong>MTN Mobile Money</strong> — Mobile money payments</li>
              <li><strong>NGenius</strong> — Card payment gateway</li>
              <li><strong>Cloudflare</strong> — Cloud infrastructure and security</li>
              <li><strong>Google</strong> — Authentication (Google Sign-In)</li>
              <li>Delivery/logistics partners — for order fulfilment only</li>
            </ul>
          </Clause>
          <Clause number="5.3" title="Legal Requirements">
            We may disclose your data if required by Zambian law, court order, or a lawful request from a government authority (e.g., the Zambia Police Service, Financial Intelligence Centre, or ZICTA).
          </Clause>
          <Clause number="5.4" title="Business Transfers">
            In the event of a merger, acquisition, or sale of business assets, your data may be transferred to the acquiring entity, subject to the same privacy protections.
          </Clause>
          <Clause number="5.5" title="Cross-Border Transfers">
            Some of our service providers (e.g., Stripe, Cloudflare) may process data outside Zambia. We ensure such transfers comply with applicable data protection requirements and that adequate safeguards are in place.
          </Clause>
        </Section>

        {/* Section 6 */}
        <Section icon={Database} title="6. Data Retention">
          <Clause number="6.1" title="Retention Periods">
            We retain personal data only for as long as necessary:
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              <li><strong>Account data:</strong> Duration of account plus 2 years after closure</li>
              <li><strong>Transaction records:</strong> 7 years (Zambian tax and financial reporting obligations)</li>
              <li><strong>Support communications:</strong> 2 years from resolution</li>
              <li><strong>Analytics/logs:</strong> 12 months (anonymised after 90 days)</li>
            </ul>
          </Clause>
          <Clause number="6.2" title="Deletion">
            After the applicable retention period, personal data is securely deleted or anonymised so it can no longer be linked to you.
          </Clause>
        </Section>

        {/* Section 7 */}
        <Section icon={Lock} title="7. Data Security">
          <Clause number="7.1" title="Security Measures">
            We implement appropriate technical and organisational security measures, including:
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              <li>Encrypted data transmission (HTTPS/TLS)</li>
              <li>Encrypted cloud storage (Cloudflare R2)</li>
              <li>Role-based access controls — only authorised personnel access personal data</li>
              <li>Regular security reviews and vulnerability assessments</li>
              <li>Multi-factor authentication for administrative systems</li>
            </ul>
          </Clause>
          <Clause number="7.2" title="Data Breach Response">
            In the event of a personal data breach, we will notify affected users and the relevant Zambian data protection authority within 72 hours of becoming aware of the breach, as required under the Data Protection Act No. 3 of 2021.
          </Clause>
          <Clause number="7.3" title="Your Responsibility">
            You are responsible for keeping your login credentials confidential. Do not share your password with anyone. Use a strong, unique password for your BwanguSpares account.
          </Clause>
        </Section>

        {/* Section 8 */}
        <Section icon={Scale} title="8. Your Rights Under the Data Protection Act No. 3 of 2021">
          <p className="mb-3">As a data subject under Zambian law, you have the following rights:</p>
          <div className="space-y-3">
            {[
              { right: "Right of Access", desc: "Request a copy of the personal data we hold about you." },
              { right: "Right to Rectification", desc: "Request correction of inaccurate or incomplete personal data." },
              { right: "Right to Erasure", desc: "Request deletion of your personal data where there is no longer a lawful reason for us to hold it." },
              { right: "Right to Restrict Processing", desc: "Request that we limit the processing of your data in certain circumstances." },
              { right: "Right to Data Portability", desc: "Receive your personal data in a structured, machine-readable format to transfer to another service." },
              { right: "Right to Object", desc: "Object to processing of your data based on legitimate interests or for direct marketing." },
              { right: "Right to Withdraw Consent", desc: "Where processing is based on consent, withdraw it at any time without affecting prior processing." },
              { right: "Right to Lodge a Complaint", desc: "Lodge a complaint with the Zambia Data Protection Authority or relevant authority." },
            ].map(({ right, desc }) => (
              <div key={right} className="flex gap-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{right}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-3">
            <p className="text-sm text-emerald-800 dark:text-emerald-200">
              To exercise any of these rights, contact us at <strong>admin@bwangu.com</strong>. We will respond within <strong>30 days</strong>. We may request proof of identity before processing your request.
            </p>
          </div>
        </Section>

        {/* Section 9 */}
        <Section icon={Trash2} title="9. Account Deletion & Data Removal">
          <Clause number="9.1" title="How to Delete Your Account">
            You may request deletion of your account at any time via your Buyer Dashboard under Account Settings, or by emailing admin@bwangu.com.
          </Clause>
          <Clause number="9.2" title="What Happens on Deletion">
            Upon account deletion:
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              <li>Your profile and personal data will be removed from active systems</li>
              <li>Transaction records will be retained for 7 years for legal compliance</li>
              <li>Reviews and public content may be anonymised rather than deleted</li>
              <li>Outstanding orders or disputes must be resolved before deletion</li>
            </ul>
          </Clause>
        </Section>

        {/* Section 10 */}
        <Section icon={Globe} title="10. Third-Party Links & Services">
          <p>
            The Platform may contain links to third-party websites (e.g., shop websites, payment portals). We are not responsible for the privacy practices of those sites. We encourage you to review the privacy policy of any third-party service you interact with.
          </p>
        </Section>

        {/* Section 11 */}
        <Section icon={Shield} title="11. Changes to This Privacy Policy">
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of material changes via email or a prominent notice on the Platform at least <strong>14 days</strong> before changes take effect. Your continued use of the Platform after the effective date constitutes acceptance of the updated policy.
          </p>
        </Section>

        {/* Contact */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 mt-6">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-600" /> Privacy Enquiries
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
            For any privacy-related questions, data access requests, or complaints, contact our Data Protection Officer:
          </p>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
              <a href="mailto:admin@bwangu.com" className="text-emerald-600 dark:text-emerald-400 hover:underline">admin@bwangu.com</a>
            </p>
            <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
              <a href="tel:+260773247860" className="text-emerald-600 dark:text-emerald-400 hover:underline">+260 773 247 860</a>
            </p>
            <p className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
              <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              Flat 15C Kalewa Complex, Ndola, Zambia
            </p>
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center mt-8 text-xs text-slate-400 dark:text-slate-500 space-y-1 pb-8">
          <p>© {new Date().getFullYear()} BwanguSpares — Ikhumbi-Tech Center. All rights reserved.</p>
          <p>This Privacy Policy was last updated on {effectiveDate}.</p>
          <div className="mt-3 flex items-center justify-center gap-4">
            <Link to={createPageUrl("TermsAndConditions")} className="text-blue-500 hover:underline">Terms &amp; Conditions</Link>
            <span className="text-slate-300">·</span>
            <Link to={createPageUrl("Home")} className="text-blue-500 hover:underline">← Back to Home</Link>
          </div>
        </div>

      </div>
    </div>
  );
}