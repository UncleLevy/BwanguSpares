import React, { useState } from "react";
import { ChevronDown, ChevronUp, Shield, FileText, Lock, AlertTriangle, Scale, Globe, Phone, Mail } from "lucide-react";
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
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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
    <div className="pl-4 border-l-2 border-blue-100 dark:border-blue-800">{children}</div>
  </div>
);

export default function TermsAndConditions() {
  const effectiveDate = "26 March 2026";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-full px-4 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 mb-4">
            <Scale className="w-3.5 h-3.5" /> Legal Document
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Terms &amp; Conditions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <strong>BwanguSpares</strong> · Effective Date: {effectiveDate}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            BwanguSpares is a product of <strong className="text-slate-500 dark:text-slate-400">Ikhumbi App Limited</strong>, owned by <strong className="text-slate-500 dark:text-slate-400">Ikhumbi-Tech Center</strong> · Flat 15C Kalewa Complex, Ndola, Zambia
          </p>
        </div>

        {/* Intro */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-5 mb-6 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Please read these Terms and Conditions carefully before using BwanguSpares. By accessing or using this platform, you agree to be bound by these terms. If you do not agree, you must not use this platform.
          </p>
        </div>

        {/* Section 1 */}
        <Section icon={FileText} title="1. Definitions & Interpretation" defaultOpen={true}>
          <Clause number="1.1" title="Platform">
            "BwanguSpares" refers to the online marketplace accessible at bwangu.com and its associated mobile applications. BwanguSpares is a product of <strong>Ikhumbi App Limited</strong>, a company registered in Zambia, which is owned by <strong>Ikhumbi-Tech Center</strong>.
          </Clause>
          <Clause number="1.2" title="Users">
            "User" means any person who accesses the Platform, including Buyers, Shop Owners, Technicians, and Administrators.
          </Clause>
          <Clause number="1.3" title="Applicable Law">
            These Terms are governed by and construed in accordance with the laws of the Republic of Zambia, including but not limited to:
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              <li>The <strong>Data Protection Act No. 3 of 2021</strong></li>
              <li>The <strong>Cyber Security and Cyber Crimes Act No. 2 of 2021</strong></li>
              <li>The <strong>Electronic Communications and Transactions Act (ECTA)</strong></li>
              <li>The <strong>Consumer Protection Act No. 24 of 2010</strong></li>
              <li>The <strong>Competition and Consumer Protection Act No. 24 of 2010</strong></li>
            </ul>
          </Clause>
        </Section>

        {/* Section 2 */}
        <Section icon={Globe} title="2. Eligibility & Account Registration">
          <Clause number="2.1" title="Age Requirement">
            You must be at least 18 years of age to create an account and use this Platform. By registering, you confirm you meet this requirement in accordance with Zambian contract law.
          </Clause>
          <Clause number="2.2" title="Account Accuracy">
            You agree to provide accurate, current, and complete information during registration and to update such information as necessary. Providing false information constitutes a breach of these Terms and may be an offence under the Cyber Security and Cyber Crimes Act No. 2 of 2021.
          </Clause>
          <Clause number="2.3" title="Account Security">
            You are solely responsible for maintaining the confidentiality of your login credentials. Any activity under your account is your responsibility. Notify us immediately at admin@bwangu.com if you suspect unauthorised access.
          </Clause>
          <Clause number="2.4" title="Single Account">
            Each user is permitted one account. Creating multiple accounts to circumvent bans or restrictions is prohibited and may result in permanent suspension.
          </Clause>
        </Section>

        {/* Section 3 */}
        <Section icon={Lock} title="3. Data Protection & Privacy (Data Protection Act No. 3 of 2021)">
          <Clause number="3.1" title="Data Controller">
            Ikhumbi-Tech Center acts as the Data Controller as defined under the Data Protection Act No. 3 of 2021. We are committed to full compliance with this Act in our handling of personal data.
          </Clause>
          <Clause number="3.2" title="Data We Collect">
            We collect personal data including your name, email address, phone number, physical address, and transactional records, solely for the purpose of operating the marketplace and providing our services.
          </Clause>
          <Clause number="3.3" title="Lawful Basis for Processing">
            We process your personal data only on the following lawful bases: (a) your express consent; (b) performance of a contract with you; (c) compliance with a legal obligation; or (d) our legitimate business interests, where not overridden by your rights.
          </Clause>
          <Clause number="3.4" title="Your Rights">
            Under the Data Protection Act No. 3 of 2021, you have the right to:
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              <li>Access your personal data held by us</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data (right to erasure)</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
            To exercise these rights, contact us at <strong>admin@bwangu.com</strong>.
          </Clause>
          <Clause number="3.5" title="Data Retention">
            We retain personal data only for as long as necessary to fulfil the purposes for which it was collected, or as required by Zambian law.
          </Clause>
          <Clause number="3.6" title="Data Security">
            We implement industry-standard security measures, including encrypted cloud storage and access controls, to protect your personal data from unauthorised access, loss, or disclosure.
          </Clause>
          <Clause number="3.7" title="Third-Party Sharing">
            We do not sell your personal data. We may share data with trusted payment processors (Stripe, MTN Mobile Money, NGenius) and logistics partners strictly to fulfil your orders. All third parties are contractually bound to handle data in compliance with the Data Protection Act.
          </Clause>
        </Section>

        {/* Section 4 */}
        <Section icon={Shield} title="4. Cyber Security & Prohibited Conduct (Cyber Security and Cyber Crimes Act No. 2 of 2021)">
          <Clause number="4.1" title="Prohibited Activities">
            In accordance with the Cyber Security and Cyber Crimes Act No. 2 of 2021, users must not:
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              <li>Attempt to gain unauthorised access to the Platform or its systems</li>
              <li>Intercept, alter, or destroy data transmitted through the Platform</li>
              <li>Introduce malware, viruses, or any harmful code</li>
              <li>Use the Platform for fraud, phishing, or identity theft</li>
              <li>Conduct denial-of-service attacks or any activity that disrupts Platform operations</li>
              <li>Engage in cyberbullying, harassment, or publication of harmful content</li>
            </ul>
          </Clause>
          <Clause number="4.2" title="Reporting Cyber Incidents">
            We operate in compliance with the Zambia Computer Incidence Response Team (ZICIRT) requirements. Suspected cyber security incidents involving the Platform should be reported to admin@bwangu.com immediately.
          </Clause>
          <Clause number="4.3" title="Consequences">
            Violations of this section may result in immediate account suspension, reporting to the relevant Zambian law enforcement authorities, and civil or criminal liability under the Cyber Security and Cyber Crimes Act.
          </Clause>
        </Section>

        {/* Section 5 */}
        <Section icon={FileText} title="5. Marketplace Rules & Shop Owners">
          <Clause number="5.1" title="Seller Obligations">
            Shop Owners must ensure all product listings are accurate, legally compliant, and not counterfeit or misrepresented. Listing counterfeit auto parts is a criminal offence under Zambian law.
          </Clause>
          <Clause number="5.2" title="Platform Commission">
            BwanguSpares charges a platform commission on sales. The applicable rate is communicated during shop registration and may be updated with 30 days' notice.
          </Clause>
          <Clause number="5.3" title="Payouts">
            Payouts are processed after delivery confirmation and subject to our payout policy. BwanguSpares reserves the right to withhold payouts in cases of suspected fraud or unresolved disputes.
          </Clause>
          <Clause number="5.4" title="Shop Suspension">
            We reserve the right to suspend or remove any shop that violates these Terms, receives excessive complaints, or engages in conduct harmful to buyers or the platform's integrity.
          </Clause>
        </Section>

        {/* Section 6 */}
        <Section icon={Scale} title="6. Consumer Protection (Consumer Protection Act No. 24 of 2010)">
          <Clause number="6.1" title="Right to Accurate Information">
            In compliance with the Consumer Protection Act No. 24 of 2010, all product descriptions, prices, and terms of sale must be accurate and not misleading. Users have the right to be fully informed before making a purchase.
          </Clause>
          <Clause number="6.2" title="Returns & Refunds">
            Buyers are entitled to request returns or refunds for defective, misrepresented, or undelivered goods. Refund requests must be submitted within 7 days of delivery. We will process eligible refunds within 14 business days.
          </Clause>
          <Clause number="6.3" title="Dispute Resolution">
            In the event of a dispute between a Buyer and a Shop Owner, BwanguSpares will act as a neutral facilitator. Unresolved disputes may be escalated to the Zambia Competition and Consumer Protection Commission (CCPC).
          </Clause>
          <Clause number="6.4" title="Pricing">
            All prices are displayed in Zambian Kwacha (ZMW). BwanguSpares does not guarantee price accuracy due to third-party shop listings. Buyers will be notified of any price discrepancy before payment is confirmed.
          </Clause>
        </Section>

        {/* Section 7 */}
        <Section icon={Globe} title="7. Electronic Transactions & Payments">
          <Clause number="7.1" title="Electronic Contracts">
            Transactions conducted on this Platform constitute valid and binding electronic contracts under Zambian law. By completing a purchase, you agree to be legally bound by the terms of the transaction.
          </Clause>
          <Clause number="7.2" title="Payment Processing">
            We use secure, PCI-DSS compliant payment processors. BwanguSpares does not store credit/debit card details. For mobile money payments (MTN MoMo), standard MTN terms apply.
          </Clause>
          <Clause number="7.3" title="Transaction Records">
            Electronic records of all transactions are maintained and constitute valid proof of purchase under Zambian law.
          </Clause>
          <Clause number="7.4" title="Fraud Prevention">
            We actively monitor transactions for fraudulent activity. Suspected fraud will be reported to the Financial Intelligence Centre (FIC) of Zambia and relevant law enforcement.
          </Clause>
        </Section>

        {/* Section 8 */}
        <Section icon={AlertTriangle} title="8. Limitation of Liability & Disclaimers">
          <Clause number="8.1" title="Platform Role">
            BwanguSpares is a marketplace facilitator and is not the seller of goods listed by Shop Owners. We do not warrant the quality, legality, or fitness for purpose of any products listed by third-party shops.
          </Clause>
          <Clause number="8.2" title="Limitation">
            To the fullest extent permitted by Zambian law, BwanguSpares' total liability to any user shall not exceed the value of the specific transaction giving rise to the claim.
          </Clause>
          <Clause number="8.3" title="Force Majeure">
            We shall not be liable for any failure or delay in performance resulting from causes beyond our reasonable control, including acts of God, government actions, power outages, or internet disruptions.
          </Clause>
        </Section>

        {/* Section 9 */}
        <Section icon={Scale} title="9. Intellectual Property">
          <Clause number="9.1" title="Platform Ownership">
            All intellectual property rights in the Platform, including its design, software, trademarks, and content created by BwanguSpares, are owned by Ikhumbi-Tech Center and protected under Zambian and international intellectual property laws.
          </Clause>
          <Clause number="9.2" title="User Content">
            By uploading content (product images, descriptions, reviews) to the Platform, you grant BwanguSpares a non-exclusive, royalty-free licence to use, display, and distribute such content for the purposes of operating the marketplace.
          </Clause>
          <Clause number="9.3" title="Prohibited Use">
            You may not copy, reproduce, modify, or redistribute any part of the Platform without prior written consent from Ikhumbi-Tech Center.
          </Clause>
        </Section>

        {/* Section 10 */}
        <Section icon={FileText} title="10. Amendments & Termination">
          <Clause number="10.1" title="Changes to Terms">
            BwanguSpares reserves the right to amend these Terms at any time. Users will be notified of material changes via email or prominent notice on the Platform at least 14 days before changes take effect.
          </Clause>
          <Clause number="10.2" title="Account Termination">
            We may terminate or suspend your account at any time for breach of these Terms, fraudulent activity, or other conduct that we determine is harmful to the Platform or its users.
          </Clause>
          <Clause number="10.3" title="Effect of Termination">
            Upon termination, your right to use the Platform ceases immediately. Outstanding obligations, including payment for completed orders, survive termination.
          </Clause>
        </Section>

        {/* Section 11 */}
        <Section icon={Scale} title="11. Governing Law & Jurisdiction">
          <p>
            These Terms shall be governed exclusively by the laws of the Republic of Zambia. Any disputes arising from or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of Zambia. Both parties agree to attempt to resolve disputes amicably before resorting to litigation.
          </p>
        </Section>

        {/* Contact */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 mt-6">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-600" /> Contact Us
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
            For questions, complaints, or data protection enquiries, contact us at:
          </p>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Mail className="w-4 h-4 text-blue-500 shrink-0" />
              <a href="mailto:admin@bwangu.com" className="text-blue-600 dark:text-blue-400 hover:underline">admin@bwangu.com</a>
            </p>
            <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Phone className="w-4 h-4 text-blue-500 shrink-0" />
              <a href="tel:+260776247860" className="text-blue-600 dark:text-blue-400 hover:underline">+260 773 247 860</a>
            </p>
            <p className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
              <Shield className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              Flat 15C Kalewa Complex, Ndola, Zambia
            </p>
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center mt-8 text-xs text-slate-400 dark:text-slate-500 space-y-1 pb-8">
          <p>© {new Date().getFullYear()} BwanguSpares — Ikhumbi-Tech Center. All rights reserved.</p>
          <p>These Terms were last updated on {effectiveDate}.</p>
          <div className="mt-3">
            <Link to={createPageUrl("Home")} className="text-blue-500 hover:underline">← Back to Home</Link>
          </div>
        </div>

      </div>
    </div>
  );
}