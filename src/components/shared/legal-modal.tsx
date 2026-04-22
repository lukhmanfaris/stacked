'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LegalModalProps {
  type: 'terms' | 'privacy'
  open: boolean
  onClose: () => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--nd-text-primary)]">
        {title}
      </h3>
      <div className="font-sans text-xs leading-relaxed text-[var(--nd-text-secondary)] flex flex-col gap-1.5">
        {children}
      </div>
    </div>
  )
}

function TermsContent() {
  return (
    <div className="flex flex-col gap-6">
      <p className="font-sans text-xs text-[var(--nd-text-disabled)]">
        Effective date: 22 April 2025 · Halfx Industries
      </p>

      <Section title="1. Acceptance of Terms">
        <p>
          By creating an account or using Stacked ("the Service"), you agree to be bound by these
          Terms of Service ("Terms"). If you do not agree, do not use the Service.
        </p>
        <p>
          These Terms constitute a legally binding agreement between you and Halfx Industries
          ("we", "us", or "our"), the operator of Stacked.
        </p>
      </Section>

      <Section title="2. Description of Service">
        <p>
          Stacked is a bookmark management platform that allows users to save, organise, tag,
          and retrieve web links. The Service is available on a free tier and may offer paid
          subscription tiers with additional features in the future.
        </p>
      </Section>

      <Section title="3. Account Registration & Security">
        <p>
          You must provide accurate and complete information when registering. You are responsible
          for maintaining the confidentiality of your account credentials and for all activities
          that occur under your account.
        </p>
        <p>
          You must be at least 18 years of age, or the age of majority in your jurisdiction,
          to use the Service. By using the Service, you represent and warrant that you meet
          this requirement.
        </p>
        <p>
          Notify us immediately at support@halfxindustries.com if you suspect any unauthorised
          access to your account.
        </p>
      </Section>

      <Section title="4. Acceptable Use">
        <p>You agree not to:</p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>Use the Service for any unlawful purpose or in violation of Malaysian law</li>
          <li>Upload, store, or share content that is harmful, defamatory, or infringes third-party rights</li>
          <li>Attempt to gain unauthorised access to our systems or other users&apos; accounts</li>
          <li>Use automated tools to scrape, crawl, or extract data from the Service</li>
          <li>Interfere with or disrupt the integrity or performance of the Service</li>
          <li>Resell or commercially exploit the Service without our express written permission</li>
        </ul>
      </Section>

      <Section title="5. Intellectual Property">
        <p>
          You retain ownership of all bookmark data, notes, and content you upload or create
          through the Service. By using the Service, you grant Halfx Industries a limited,
          non-exclusive licence to store and process your content solely for the purpose of
          providing the Service.
        </p>
        <p>
          Halfx Industries owns all rights, title, and interest in the Service, including its
          software, design, trademarks, and branding. Nothing in these Terms transfers any
          ownership of our intellectual property to you.
        </p>
      </Section>

      <Section title="6. Subscription & Billing">
        <p>
          Stacked currently offers a free tier. Paid subscription plans may be introduced in
          the future, at which point additional terms and pricing will be communicated to you
          in advance. You will not be charged without your explicit consent.
        </p>
      </Section>

      <Section title="7. Termination">
        <p>
          You may delete your account at any time via the account settings. Upon deletion,
          your data will be retained for 90 days before permanent erasure, in accordance with
          our Privacy Policy.
        </p>
        <p>
          We reserve the right to suspend or terminate your account without notice if you
          violate these Terms or engage in conduct that harms other users or the Service.
        </p>
      </Section>

      <Section title="8. Disclaimer of Warranties">
        <p>
          The Service is provided on an "as is" and "as available" basis without warranties
          of any kind, express or implied, including but not limited to warranties of
          merchantability, fitness for a particular purpose, or non-infringement.
        </p>
        <p>
          We do not warrant that the Service will be uninterrupted, error-free, or free of
          viruses or other harmful components.
        </p>
      </Section>

      <Section title="9. Limitation of Liability">
        <p>
          To the fullest extent permitted by Malaysian law, Halfx Industries shall not be
          liable for any indirect, incidental, special, consequential, or punitive damages
          arising from your use of, or inability to use, the Service.
        </p>
        <p>
          Our total aggregate liability to you for any claims arising under these Terms shall
          not exceed the amount you paid us in the 12 months preceding the claim, or MYR 100,
          whichever is greater.
        </p>
      </Section>

      <Section title="10. Governing Law">
        <p>
          These Terms are governed by and construed in accordance with the laws of Malaysia.
          Any disputes arising out of or in connection with these Terms shall be subject to
          the exclusive jurisdiction of the courts of Malaysia.
        </p>
      </Section>

      <Section title="11. Changes to Terms">
        <p>
          We may update these Terms from time to time. If we make material changes, we will
          notify you by email or via a prominent notice within the Service at least 14 days
          before the changes take effect. Continued use of the Service after that date
          constitutes acceptance of the revised Terms.
        </p>
      </Section>

      <Section title="12. Contact">
        <p>
          For questions about these Terms, contact us at:{' '}
          <span className="text-[var(--nd-text-primary)]">support@halfxindustries.com</span>
        </p>
      </Section>
    </div>
  )
}

function PrivacyContent() {
  return (
    <div className="flex flex-col gap-6">
      <p className="font-sans text-xs text-[var(--nd-text-disabled)]">
        Effective date: 22 April 2025 · Halfx Industries · Compliant with Malaysia Personal Data Protection Act 2010
      </p>

      <Section title="1. Data Controller">
        <p>
          Halfx Industries ("we", "us", or "our") is the data controller responsible for
          personal data collected through Stacked. We are committed to protecting your personal
          data in accordance with the Personal Data Protection Act 2010 (PDPA) of Malaysia.
        </p>
      </Section>

      <Section title="2. Data We Collect">
        <p>We collect the following categories of personal data:</p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li><strong>Account data:</strong> Email address, username, and display name provided during registration</li>
          <li><strong>Bookmark data:</strong> URLs, page titles, descriptions, tags, and categories you save to the Service</li>
          <li><strong>Technical data:</strong> IP address, browser type, operating system, and device identifiers, collected automatically for security and fraud prevention</li>
          <li><strong>Usage data:</strong> Feature interactions, session duration, and click patterns used to improve the Service</li>
          <li><strong>Marketing preference:</strong> Whether you have opted in to receive product updates and announcements</li>
        </ul>
        <p>
          We do not collect sensitive personal data as defined under the PDPA (e.g., health,
          financial, biometric, or political data).
        </p>
      </Section>

      <Section title="3. Purpose of Processing">
        <p>
          Under Section 6 of the PDPA 2010, we collect and process your personal data for
          the following purposes:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li>Providing, maintaining, and improving the Service</li>
          <li>Account creation, authentication, and security</li>
          <li>Fraud detection and prevention</li>
          <li>Sending transactional communications (account confirmations, security alerts)</li>
          <li>Sending product updates, feature announcements, and promotional content — <strong>only if you have given marketing consent</strong></li>
          <li>Aggregated, anonymised analytics to inform future product decisions</li>
          <li>Complying with our legal obligations under Malaysian law</li>
        </ul>
      </Section>

      <Section title="4. Legal Basis for Processing">
        <p>
          We process your personal data on the basis of your consent, given when you accept
          these Terms during account creation. You may withdraw consent at any time by
          deleting your account (see Section 8).
        </p>
        <p>
          Marketing communications are processed on the separate marketing consent you provide
          during sign-up. You may opt out at any time without affecting your use of the Service.
        </p>
      </Section>

      <Section title="5. Data Retention">
        <p>
          We retain your personal data for as long as your account is active. Upon account
          deletion, your data will be permanently erased within 90 days, except where
          retention is required by Malaysian law or for legitimate business purposes such as
          fraud prevention.
        </p>
      </Section>

      <Section title="6. Data Sharing & Disclosure">
        <p>
          We do not sell, rent, or trade your personal data to third parties. We may share
          your data with:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li><strong>Service providers:</strong> Infrastructure and hosting providers (e.g., Supabase) acting as data processors under contractual obligations</li>
          <li><strong>Legal authorities:</strong> Where required by Malaysian law, court order, or to protect the rights and safety of users</li>
        </ul>
        <p>
          Any third-party data processors are bound by data processing agreements that
          prohibit them from using your data for their own purposes.
        </p>
      </Section>

      <Section title="7. International Data Transfers">
        <p>
          Your data may be processed on servers located outside Malaysia (including servers
          operated by Supabase). We take appropriate safeguards to ensure that such transfers
          comply with the PDPA 2010, including entering into standard contractual clauses
          with our data processors where required.
        </p>
      </Section>

      <Section title="8. Your Rights under PDPA 2010">
        <p>You have the following rights regarding your personal data:</p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li><strong>Right of access:</strong> Request a copy of the personal data we hold about you</li>
          <li><strong>Right to correction:</strong> Request correction of inaccurate or incomplete data</li>
          <li><strong>Right to withdraw consent:</strong> Withdraw your consent to data processing at any time; this will result in account closure</li>
          <li><strong>Right to limit processing:</strong> Request that we limit how we use your data in certain circumstances</li>
        </ul>
        <p>
          To exercise any of these rights, contact our data officer at:{' '}
          <span className="text-[var(--nd-text-primary)]">privacy@halfxindustries.com</span>
        </p>
        <p>
          We will respond to verified requests within 21 days, in accordance with the PDPA 2010.
        </p>
      </Section>

      <Section title="9. Cookies">
        <p>
          We use a minimal session cookie strictly necessary to keep you signed in. We do not
          use third-party tracking cookies or advertising cookies. You can disable cookies in
          your browser settings, but doing so may prevent you from using the Service.
        </p>
      </Section>

      <Section title="10. Marketing Communications">
        <p>
          If you opted in to marketing communications during registration, we may send you
          product updates, feature announcements, and relevant promotional content by email.
        </p>
        <p>
          You may opt out at any time by clicking the unsubscribe link in any marketing email,
          or by contacting us at{' '}
          <span className="text-[var(--nd-text-primary)]">privacy@halfxindustries.com</span>.
          Opting out of marketing does not affect your receipt of transactional emails.
        </p>
      </Section>

      <Section title="11. Changes to this Policy">
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our
          practices or legal requirements. Material changes will be communicated to you by
          email at least 14 days before taking effect. Your continued use of the Service
          after that date constitutes acceptance of the revised Policy.
        </p>
      </Section>

      <Section title="12. Contact & Data Requests">
        <p>
          For any questions, concerns, or data requests, please contact:
        </p>
        <ul className="list-none space-y-0.5 pl-1">
          <li>Halfx Industries</li>
          <li>Data Protection Officer</li>
          <li><span className="text-[var(--nd-text-primary)]">privacy@halfxindustries.com</span></li>
        </ul>
      </Section>
    </div>
  )
}

export function LegalModal({ type, open, onClose }: LegalModalProps) {
  // Lock body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const title = type === 'terms' ? 'Terms of Service' : 'Privacy Policy'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative flex w-full max-w-lg flex-col rounded-[16px] border border-[var(--nd-border-visible)] bg-[var(--nd-surface)] shadow-xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--nd-border)] px-5 py-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--nd-text-secondary)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[4px] p-1 text-[var(--nd-text-disabled)] transition-colors hover:text-[var(--nd-text-primary)]"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className={cn(
          'flex-1 overflow-y-auto px-5 py-5',
          'max-h-[65vh]',
          '[scrollbar-width:thin]',
        )}>
          {type === 'terms' ? <TermsContent /> : <PrivacyContent />}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[var(--nd-border)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-[8px] border border-[var(--nd-border-visible)] py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--nd-text-secondary)] transition-colors hover:border-[var(--nd-text-primary)] hover:text-[var(--nd-text-primary)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
