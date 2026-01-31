import Link from "next/link";
import { Zap } from "lucide-react";

export const metadata = {
  title: "Terms of Service - Founders Helm",
  description: "Terms of Service for Founders Helm",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF6F1] text-stone-900">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/60 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors mb-6">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">Founders Helm</span>
          </Link>
          <h1 className="text-4xl font-bold text-stone-900 mt-4">Terms of Service</h1>
          <p className="text-stone-500 mt-2">Last updated: January 30, 2026</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-stone max-w-none space-y-8">

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">1. Agreement to Terms</h2>
            <p className="text-stone-700 leading-relaxed">
              By accessing or using Founders Helm (&quot;the Service&quot;), operated by Founders Helm
              (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to be bound by these Terms of Service
              (&quot;Terms&quot;). If you do not agree to these Terms, you may not access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">2. Description of Service</h2>
            <p className="text-stone-700 leading-relaxed">
              Founders Helm is a software-as-a-service (SaaS) platform that provides business
              management tools including, but not limited to: landing page builder, personal CRM,
              code vault, content engine, project management, AI advisor, analytics, feedback
              collection, and command center dashboard. The Service is designed for solo founders
              and small business owners.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">3. Account Registration</h2>
            <p className="text-stone-700 leading-relaxed mb-3">
              To use the Service, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-stone-700 space-y-2 ml-2">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security and confidentiality of your login credentials</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
            <p className="text-stone-700 leading-relaxed mt-3">
              You must be at least 18 years old or the age of legal majority in your jurisdiction to
              create an account and use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">4. Free Trial</h2>
            <p className="text-stone-700 leading-relaxed">
              New accounts receive a 14-day free trial with full access to all features. No credit
              card is required to start a trial. At the end of the trial period, your account will
              enter read-only mode until you subscribe to a paid plan. Your data will be preserved
              during read-only mode and restored to full access upon upgrading.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">5. Subscription Plans and Payment</h2>
            <p className="text-stone-700 leading-relaxed mb-3">
              The Service offers the following paid plans:
            </p>
            <ul className="list-disc list-inside text-stone-700 space-y-2 ml-2">
              <li><strong>Pro Plan:</strong> $29 per month, billed monthly. Provides full access to all features with defined usage limits.</li>
              <li><strong>Lifetime Plan:</strong> $299 one-time payment. Provides unlimited, perpetual access to the Service and all future updates.</li>
            </ul>
            <p className="text-stone-700 leading-relaxed mt-3">
              Payments are processed securely through Stripe. By subscribing, you authorize us to
              charge the applicable fees to your selected payment method. Monthly subscriptions
              renew automatically unless cancelled before the next billing cycle.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">6. Cancellation and Refunds</h2>
            <p className="text-stone-700 leading-relaxed mb-3">
              You may cancel your Pro subscription at any time through your billing settings or
              the Stripe customer portal. Upon cancellation:
            </p>
            <ul className="list-disc list-inside text-stone-700 space-y-2 ml-2">
              <li>You will retain access until the end of your current billing period</li>
              <li>Your account will revert to read-only mode after the billing period ends</li>
              <li>Your data will be preserved and accessible in read-only mode</li>
            </ul>
            <p className="text-stone-700 leading-relaxed mt-3">
              Refunds for monthly subscriptions are generally not provided for partial billing
              periods. Lifetime plan purchases are non-refundable after 30 days. If you are
              unsatisfied within 30 days of a Lifetime purchase, contact us for a full refund.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">7. Acceptable Use</h2>
            <p className="text-stone-700 leading-relaxed mb-3">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc list-inside text-stone-700 space-y-2 ml-2">
              <li>Violate any applicable laws, regulations, or third-party rights</li>
              <li>Upload or distribute malware, viruses, or other harmful code</li>
              <li>Send spam, phishing attempts, or unsolicited communications through the platform</li>
              <li>Attempt to gain unauthorized access to the Service or its infrastructure</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Scrape, crawl, or use automated means to access the Service without permission</li>
              <li>Impersonate any person or entity or misrepresent your affiliation</li>
              <li>Use the Service for any illegal, fraudulent, or harmful purpose</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">8. Your Content and Data</h2>
            <p className="text-stone-700 leading-relaxed">
              You retain full ownership of all content, data, and materials you upload to the
              Service (&quot;Your Content&quot;). By using the Service, you grant us a limited license to
              host, store, and display Your Content solely for the purpose of providing the
              Service to you. We do not claim any ownership rights over Your Content. You are
              responsible for ensuring you have the necessary rights to any content you upload.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">9. Intellectual Property</h2>
            <p className="text-stone-700 leading-relaxed">
              The Service, including its design, features, code, and documentation, is owned by
              us and protected by intellectual property laws. You may not copy, modify, distribute,
              sell, or lease any part of the Service without our prior written consent. The Founders
              Helm name, logo, and branding are our trademarks and may not be used without
              permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">10. Service Availability</h2>
            <p className="text-stone-700 leading-relaxed">
              We strive to maintain high availability of the Service but do not guarantee
              uninterrupted access. The Service may be temporarily unavailable due to maintenance,
              updates, or circumstances beyond our control. We will make reasonable efforts to
              notify users of planned downtime in advance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">11. Limitation of Liability</h2>
            <p className="text-stone-700 leading-relaxed">
              To the maximum extent permitted by law, the Service is provided &quot;as is&quot; and &quot;as
              available&quot; without warranties of any kind. We shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages arising from your use of the
              Service. Our total liability shall not exceed the amount you paid us in the twelve
              (12) months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">12. Termination</h2>
            <p className="text-stone-700 leading-relaxed">
              We reserve the right to suspend or terminate your account if you violate these
              Terms or engage in conduct that is harmful to other users or the Service. You may
              delete your account at any time through your account settings. Upon account
              deletion, your data will be permanently removed in accordance with our Privacy
              Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">13. Changes to Terms</h2>
            <p className="text-stone-700 leading-relaxed">
              We may update these Terms from time to time. We will notify you of material
              changes by posting the updated Terms on the Service and updating the &quot;Last
              updated&quot; date. Your continued use of the Service after changes take effect
              constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">14. Governing Law</h2>
            <p className="text-stone-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable law,
              without regard to conflict of law principles. Any disputes arising from these Terms
              or the Service shall be resolved through good-faith negotiation, and if necessary,
              binding arbitration.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">15. Contact Us</h2>
            <p className="text-stone-700 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:support@foundershelm.com" className="text-orange-600 hover:text-orange-700 underline">
                support@foundershelm.com
              </a>.
            </p>
          </section>

        </div>

        {/* Back link */}
        <div className="mt-16 pt-8 border-t border-stone-200 flex items-center justify-between text-sm text-stone-500">
          <Link href="/" className="hover:text-stone-900 transition-colors">
            &larr; Back to Founders Helm
          </Link>
          <Link href="/privacy" className="hover:text-stone-900 transition-colors">
            Privacy Policy &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
