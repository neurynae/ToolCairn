import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service · ToolCairn',
  description: 'Terms of service for using ToolCairn — the graph-powered tool intelligence platform.',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="mb-8">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to ToolCairn
        </Link>
      </div>

      <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">Terms of Service</h1>
      <p className="mb-10 text-sm text-muted-foreground">Last updated: April 2026</p>

      <div className="prose prose-sm max-w-none text-foreground space-y-8">

        <section>
          <h2 className="text-xl font-semibold mb-3">1. Acceptance</h2>
          <p className="text-muted-foreground leading-relaxed">
            By creating an account or using ToolCairn (&quot;the Service&quot;), you agree to these Terms of Service.
            If you do not agree, do not use the Service. The Service is operated by NEURYNAE.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
          <p className="text-muted-foreground leading-relaxed">
            ToolCairn is an open-source tool intelligence platform that helps developers discover, compare, and evaluate
            open-source tools via a web interface and MCP (Model Context Protocol) server. The platform indexes publicly
            available information about open-source projects.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Account Registration</h2>
          <p className="text-muted-foreground leading-relaxed">
            You must create an account to use the MCP tools and most features. You are responsible for maintaining the
            security of your account credentials. You must provide accurate information during registration.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Acceptable Use</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">You agree not to:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 leading-relaxed">
            <li>Use the Service in a way that violates any applicable law or regulation</li>
            <li>Attempt to circumvent rate limits or access controls</li>
            <li>Scrape or bulk-download data from the Service</li>
            <li>Use the Service to harm, harass, or deceive others</li>
            <li>Attempt to reverse-engineer the proprietary components of the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Open Source</h2>
          <p className="text-muted-foreground leading-relaxed">
            The ToolCairn platform is open source and available on{' '}
            <a
              href="https://github.com/NEURYNAE/ToolCairn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline"
            >
              GitHub
            </a>{' '}
            under the MIT license. The hosted service may include additional proprietary components (graph data,
            embeddings, trained weights) not covered by the open-source license.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Rate Limits</h2>
          <p className="text-muted-foreground leading-relaxed">
            Free-tier accounts are subject to rate limits (60 requests/minute). Authenticated accounts receive higher
            limits. We reserve the right to adjust rate limits at any time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Disclaimer of Warranties</h2>
          <p className="text-muted-foreground leading-relaxed">
            The Service is provided &quot;as is&quot; without warranty of any kind. We do not guarantee that tool
            recommendations are accurate, complete, or suitable for any particular purpose. Tool health data is sourced
            from public repositories and may be outdated.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            To the maximum extent permitted by law, NEURYNAE shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages arising from your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Termination</h2>
          <p className="text-muted-foreground leading-relaxed">
            We reserve the right to suspend or terminate accounts that violate these Terms. You may delete your account
            at any time by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Changes</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update these Terms from time to time. Continued use of the Service after changes constitutes
            acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">11. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            Questions about these Terms? Contact us at{' '}
            <a href="mailto:support@neurynae.com" className="text-foreground underline">
              support@neurynae.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
