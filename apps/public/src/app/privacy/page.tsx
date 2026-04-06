import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy · ToolCairn',
  description: 'Privacy policy for ToolCairn — how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="mb-8">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to ToolCairn
        </Link>
      </div>

      <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
      <p className="mb-10 text-sm text-muted-foreground">Last updated: April 2026</p>

      <div className="prose prose-sm max-w-none text-foreground space-y-8">

        <section>
          <h2 className="text-xl font-semibold mb-3">1. Overview</h2>
          <p className="text-muted-foreground leading-relaxed">
            ToolCairn (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is an open-source tool intelligence platform operated by NEURYNAE.
            This policy explains what information we collect when you use ToolCairn, how we use it, and your rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
          <h3 className="text-base font-medium mb-2">Account information</h3>
          <p className="text-muted-foreground leading-relaxed mb-3">
            When you create an account we collect your name, email address, and authentication provider (Google, GitHub, or email/password).
            Passwords are hashed with bcrypt and never stored in plain text.
          </p>
          <h3 className="text-base font-medium mb-2">Usage data</h3>
          <p className="text-muted-foreground leading-relaxed mb-3">
            We log MCP tool invocations (tool name, duration, success/failure) to improve search quality and monitor system health.
            Logs do not contain the content of your searches beyond what is necessary for the service.
          </p>
          <h3 className="text-base font-medium mb-2">Search queries</h3>
          <p className="text-muted-foreground leading-relaxed">
            Search queries submitted through the MCP tools or web interface may be stored anonymously to improve recommendations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 leading-relaxed">
            <li>Provide and operate the ToolCairn service</li>
            <li>Authenticate you when you sign in</li>
            <li>Improve search quality and tool recommendations</li>
            <li>Monitor service health and prevent abuse</li>
            <li>Send transactional emails (account-related only, no marketing)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Third-Party Services</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">We use the following third-party services:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 leading-relaxed">
            <li><strong>Google OAuth</strong> — optional sign-in method. Governed by Google&apos;s Privacy Policy.</li>
            <li><strong>GitHub OAuth</strong> — optional sign-in method. Governed by GitHub&apos;s Privacy Policy.</li>
            <li><strong>Vercel</strong> — web application hosting. May process request metadata.</li>
            <li><strong>Cloudflare</strong> — API gateway and CDN. Processes request IP addresses for rate limiting.</li>
            <li><strong>AWS</strong> — infrastructure hosting for the backend API and databases.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-3">
            We do not sell your data to any third party.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Data Retention</h2>
          <p className="text-muted-foreground leading-relaxed">
            Account data is retained as long as your account is active. Usage logs are retained for up to 90 days.
            You may request deletion of your account and associated data by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at
            the email below. We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use industry-standard security practices including HTTPS encryption, bcrypt password hashing, and JWT-based
            authentication. No system is perfectly secure; we encourage you to use a strong unique password.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Changes to This Policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this policy from time to time. Material changes will be reflected by updating the date at the
            top of this page.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            Questions about this privacy policy? Contact us at{' '}
            <a href="mailto:support@neurynae.com" className="text-foreground underline">
              support@neurynae.com
            </a>{' '}
            or open an issue on{' '}
            <a
              href="https://github.com/NEURYNAE/ToolCairn/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline"
            >
              GitHub
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
