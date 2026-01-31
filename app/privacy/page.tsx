import Link from "next/link";
import { FoundersHelmIcon } from "@/components/founders-helm-icon";

export const metadata = {
  title: "Privacy Policy - Founders Helm",
  description: "Privacy Policy for Founders Helm",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF6F1] text-stone-900">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/60 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors mb-6">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 via-amber-500 to-red-600 flex items-center justify-center">
              <FoundersHelmIcon className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">Founders Helm</span>
          </Link>
          <h1 className="text-4xl font-bold text-stone-900 mt-4">Privacy Policy</h1>
          <p className="text-stone-500 mt-2">Last updated: January 30, 2026</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-stone max-w-none space-y-8">

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">1. Introduction</h2>
            <p className="text-stone-700 leading-relaxed">
              Founders Helm (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy and is committed to
              protecting your personal data. This Privacy Policy explains how we collect, use,
              store, and share your information when you use our platform and services
              (&quot;the Service&quot;). By using the Service, you consent to the practices described
              in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">2. Information We Collect</h2>

            <h3 className="text-lg font-medium text-stone-800 mt-4 mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside text-stone-700 space-y-2 ml-2">
              <li><strong>Account Information:</strong> Name, email address, and profile photo when you create an account (including via Google or GitHub OAuth)</li>
              <li><strong>Billing Information:</strong> Payment details are processed securely by Stripe. We store your Stripe customer ID but do not store credit card numbers directly.</li>
              <li><strong>User Content:</strong> Any data, documents, contacts, code snippets, landing pages, projects, and other content you create or upload to the Service</li>
              <li><strong>Communications:</strong> Messages you send to us for support or feedback</li>
            </ul>

            <h3 className="text-lg font-medium text-stone-800 mt-4 mb-2">2.2 Information Collected Automatically</h3>
            <ul className="list-disc list-inside text-stone-700 space-y-2 ml-2">
              <li><strong>Usage Data:</strong> Pages visited, features used, and actions taken within the Service</li>
              <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers</li>
              <li><strong>Log Data:</strong> IP address, access times, and referring URLs</li>
              <li><strong>Analytics:</strong> Aggregated usage patterns to improve the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">3. How We Use Your Information</h2>
            <p className="text-stone-700 leading-relaxed mb-3">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-stone-700 space-y-2 ml-2">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process payments and manage your subscription</li>
              <li>Send transactional emails (account confirmations, billing receipts, security alerts)</li>
              <li>Respond to your support requests and communications</li>
              <li>Monitor and analyze usage trends to improve user experience</li>
              <li>Detect, prevent, and address technical issues or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="text-stone-700 leading-relaxed mt-3">
              We do <strong>not</strong> sell your personal information to third parties. We do <strong>not</strong> use
              your content to train machine learning models. Any AI features (such as the AI Advisor)
              process your data only to provide you with responses and do not retain that data for
              training purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">4. Data Storage and Security</h2>
            <p className="text-stone-700 leading-relaxed mb-3">
              Your data is stored securely using industry-standard infrastructure:
            </p>
            <ul className="list-disc list-inside text-stone-700 space-y-2 ml-2">
              <li><strong>Database:</strong> Your data is stored in Supabase (built on PostgreSQL) with row-level security policies ensuring you can only access your own data</li>
              <li><strong>Encryption:</strong> All data is encrypted in transit (TLS/SSL) and at rest</li>
              <li><strong>Authentication:</strong> Managed through Supabase Auth with secure session handling</li>
              <li><strong>Payment Processing:</strong> Handled entirely by Stripe, a PCI DSS Level 1 certified payment processor</li>
            </ul>
            <p className="text-stone-700 leading-relaxed mt-3">
              While we implement appropriate security measures, no method of electronic
              transmission or storage is 100% secure. We cannot guarantee absolute security
              of your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">5. Third-Party Services</h2>
            <p className="text-stone-700 leading-relaxed mb-3">
              We use the following third-party services to operate the platform:
            </p>
            <ul className="list-disc list-inside text-stone-700 space-y-2 ml-2">
              <li><strong>Supabase:</strong> Database hosting, authentication, and file storage</li>
              <li><strong>Stripe:</strong> Payment processing and subscription management</li>
              <li><strong>Vercel:</strong> Application hosting and deployment</li>
              <li><strong>OpenAI:</strong> Powers AI Advisor features (data is not used for model training)</li>
            </ul>
            <p className="text-stone-700 leading-relaxed mt-3">
              Each third-party provider has their own privacy policy governing how they handle
              data. We encourage you to review their policies. We only share the minimum data
              necessary for each service to function.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">6. Cookies and Tracking</h2>
            <p className="text-stone-700 leading-relaxed mb-3">
              The Service uses essential cookies and local storage for:
            </p>
            <ul className="list-disc list-inside text-stone-700 space-y-2 ml-2">
              <li><strong>Authentication:</strong> Maintaining your login session</li>
              <li><strong>Preferences:</strong> Storing your workspace selection and UI preferences</li>
            </ul>
            <p className="text-stone-700 leading-relaxed mt-3">
              We do not use third-party advertising cookies or cross-site tracking. You can
              manage cookie preferences through your browser settings, though disabling essential
              cookies may affect the functionality of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">7. Data Retention</h2>
            <p className="text-stone-700 leading-relaxed">
              We retain your data for as long as your account is active. If your trial expires
              and you do not upgrade, your data is preserved in read-only mode indefinitely so
              you can access it if you choose to upgrade later. If you request account deletion,
              we will permanently delete your personal data and content within 30 days, except
              where we are required to retain certain information for legal or compliance purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">8. Your Rights</h2>
            <p className="text-stone-700 leading-relaxed mb-3">
              Depending on your location, you may have the following rights regarding your data:
            </p>
            <ul className="list-disc list-inside text-stone-700 space-y-2 ml-2">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate personal data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data and account</li>
              <li><strong>Export:</strong> Export your data in a portable format (available via Settings)</li>
              <li><strong>Objection:</strong> Object to certain types of data processing</li>
              <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
            </ul>
            <p className="text-stone-700 leading-relaxed mt-3">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:privacy@foundershelm.com" className="text-orange-600 hover:text-orange-700 underline">
                privacy@foundershelm.com
              </a>.
              We will respond to your request within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">9. Children&apos;s Privacy</h2>
            <p className="text-stone-700 leading-relaxed">
              The Service is not intended for individuals under the age of 18. We do not
              knowingly collect personal information from children. If we become aware that
              we have collected data from a child under 18, we will take steps to delete
              that information promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">10. International Data Transfers</h2>
            <p className="text-stone-700 leading-relaxed">
              Your data may be processed and stored in countries other than your country of
              residence. By using the Service, you consent to the transfer of your data to
              these countries. We ensure that appropriate safeguards are in place to protect
              your data in accordance with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">11. Changes to This Policy</h2>
            <p className="text-stone-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of
              material changes by posting the updated policy on the Service and updating the
              &quot;Last updated&quot; date. We may also send you an email notification for significant
              changes. Your continued use of the Service after changes take effect constitutes
              acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">12. Contact Us</h2>
            <p className="text-stone-700 leading-relaxed">
              If you have any questions about this Privacy Policy or how we handle your data,
              please contact us at{" "}
              <a href="mailto:privacy@foundershelm.com" className="text-orange-600 hover:text-orange-700 underline">
                privacy@foundershelm.com
              </a>.
            </p>
          </section>

        </div>

        {/* Back link */}
        <div className="mt-16 pt-8 border-t border-stone-200 flex items-center justify-between text-sm text-stone-500">
          <Link href="/" className="hover:text-stone-900 transition-colors">
            &larr; Back to Founders Helm
          </Link>
          <Link href="/terms" className="hover:text-stone-900 transition-colors">
            Terms of Service &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
