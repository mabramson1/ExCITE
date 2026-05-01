export const metadata = { title: "Privacy Policy — Docs²" };

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm">
          Last updated: April 17, 2026
        </p>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <p>
          Docs² (Docs for Docs) is a
          medical writing application that uses AI to help healthcare
          professionals and researchers with clinical documentation, manuscript
          citations, and text analysis. Your privacy matters to us. This policy
          explains what data we collect, how we use it, and the choices you have.
        </p>

        <section>
          <h2 className="text-lg font-semibold">Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Account information:</strong> Your name and email address
              when you sign up or log in.
            </li>
            <li>
              <strong>Content you submit:</strong> Clinical notes, manuscript
              text, and other documents you upload for analysis.
            </li>
            <li>
              <strong>Analysis results:</strong> AI-generated outputs such as
              citations, rewritten text, and detection scores.
            </li>
            <li>
              <strong>Usage data:</strong> Basic analytics about how you
              interact with the application (pages visited, features used).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To provide and improve the Docs² analysis tools.</li>
            <li>To store your analysis history so you can revisit past results.</li>
            <li>To generate shareable read-only links when you choose to share a result.</li>
            <li>To authenticate your account and maintain your session.</li>
          </ul>
          <p className="mt-2">
            We do <strong>not</strong> sell your data to third parties. We do{" "}
            <strong>not</strong> use your submitted content to train AI models.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            Data Storage &amp; Security
          </h2>
          <p>
            Your data is stored in a PostgreSQL database hosted on Supabase with
            encryption at rest and in transit. We follow industry-standard
            security practices to protect your information.
          </p>
          <p>
            <strong>PHI auto-detection and redaction:</strong> Docs²
            automatically scans your input for common Protected Health
            Information (PHI) patterns — including names (when labeled), MRNs,
            SSNs, dates of birth, phone numbers, email addresses, street
            addresses, insurance numbers, and IP addresses — and redacts them
            in your browser <em>before</em> any text is sent to external
            services. This is best-effort pattern matching and may not catch
            all identifiers. You should avoid inputting unnecessary patient
            data and should not rely solely on automatic redaction for
            regulatory compliance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Third-Party Services</h2>
          <p>
            Docs² integrates with the following external services to provide its
            features. Each service receives only the minimum data necessary and
            only after detected PHI has been redacted:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>AI Generation Provider:</strong> A third-party large
              language model service powers AI analysis including clinical
              note processing, citation generation, and text rewriting.
            </li>
            <li>
              <strong>AI Detection Providers:</strong> Third-party detection
              engines provide AI-generated text scoring used in our consensus
              detector.
            </li>
            <li>
              <strong>Vercel Analytics:</strong> Collects anonymous, aggregate
              usage metrics (no personal data).
            </li>
            <li>
              <strong>Supabase:</strong> Hosts the database that stores your
              account and analysis history.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Cookies</h2>
          <p>
            We use cookies strictly for authentication and session management
            via Better Auth. These cookies keep you logged in and do not track
            you across other websites. We do not use advertising or
            cross-site tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Shared Links</h2>
          <p>
            When you create a share link for an analysis result, a read-only
            page becomes publicly accessible to anyone with the URL. Shared
            pages display only the analysis output — never your account details.
            You can revoke a share link at any time from your history.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Data Retention</h2>
          <p>
            Your analysis history is retained as long as your account is active.
            You can delete individual analyses from your history at any time. If
            you delete your account, all associated data — including saved
            analyses and share links — will be permanently removed.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Your Rights</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access and download the data we hold about you.</li>
            <li>Delete your analysis history or your entire account.</li>
            <li>Revoke any active share links.</li>
            <li>
              Request a copy of your personal data in a portable format.
            </li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, contact us using the information
            below.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Children&apos;s Privacy</h2>
          <p>
            Docs² is designed for healthcare professionals and academic
            researchers. We do not knowingly collect information from anyone
            under the age of 18. If you believe a minor has provided us with
            personal data, please contact us and we will promptly delete it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. When we make
            material changes, we will update the &quot;Last updated&quot; date at the top
            of this page and notify active users via email when possible.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Contact</h2>
          <p>
            If you have questions or concerns about this privacy policy or your
            data, please reach out to us at{" "}
            <a
              href="mailto:privacy@docsquared.app"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              privacy@docsquared.app
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
