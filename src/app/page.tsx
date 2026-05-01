import Link from "next/link";
import {
  FileText,
  BookOpen,
  ScanSearch,
  Shield,
  Lock,
  ArrowRight,
  ArrowDown,
  Upload,
  BrainCircuit,
  CheckCircle2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandLogo, BrandEquation } from "@/components/brand-logo";
import { FeaturePreview } from "@/components/feature-preview";
import {
  ClinicalMockup,
  AcademicMockup,
  AiIntegrityMockup,
  PrivacyMockup,
} from "@/components/feature-mockups";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const clinicalFeatures = [
  {
    title: "A/P Writer",
    description: "Generate robust Assessment & Plans from skeleton outlines",
  },
  {
    title: "Prior Auth Letters",
    description: "Medical necessity letters with guideline citations",
  },
  {
    title: "Discharge Summaries",
    description: "Structured hospital discharge with med reconciliation",
  },
  {
    title: "Referral Letters",
    description: "Specialist referrals with specific clinical questions",
  },
  {
    title: "RVU Calculator",
    description: "See reimbursement impact and optimization hints",
  },
  {
    title: "ICD-10/CPT Coding",
    description: "AI-powered coding with E&M level determination",
  },
];

const academicFeatures = [
  {
    title: "Manuscript Writer",
    description: "Transform rough notes into polished IMRAD manuscripts",
  },
  {
    title: "Citation Finder",
    description: "PubMed & CrossRef verified, never hallucinated",
  },
  {
    title: "Peer Review Response",
    description: "Point-by-point response letters from reviewer comments",
  },
  {
    title: "Bibliography Formatting",
    description: "APA, MLA, Chicago, Vancouver, Harvard, IEEE",
  },
];

const aiIntegrityFeatures = [
  {
    title: "AI Text Detector",
    description:
      "Multi-source consensus: Claude + Sapling + Pangram + local heuristics",
  },
  {
    title: "De-AI-ifier",
    description: "29-pattern rewrite with 2-pass audit and voice calibration",
  },
  {
    title: "Compliance Report",
    description:
      "Printable PDF with all detector scores and signature lines",
  },
];

const privacyFeatures = [
  {
    title: "Browser-Side Redaction",
    description:
      "Detected patient identifiers are redacted in your browser before sending",
  },
  {
    title: "Broad PHI Coverage",
    description:
      "Client-side PHI auto-detection covers names, MRNs, SSNs, dates, phones, addresses, and more",
  },
  {
    title: "Best-Effort Safeguard",
    description:
      "Automatic redaction is best-effort — do not rely solely on it for regulatory compliance",
  },
  {
    title: "Local Re-Injection",
    description: "Real values are re-injected locally for display only",
  },
];

const steps = [
  {
    icon: Upload,
    label: "Paste or upload your text",
  },
  {
    icon: BrainCircuit,
    label: "AI analyzes with PHI auto-redacted",
  },
  {
    icon: CheckCircle2,
    label: "Get results with real values restored",
  },
];

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    quota: "10 generations / month",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    quota: "100 generations / month",
    highlight: true,
  },
  {
    name: "Unlimited",
    price: "$39",
    period: "/month",
    quota: "Unlimited generations",
    highlight: false,
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <BrandLogo showTagline />
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <BrandEquation className="mb-8" />

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            The AI-powered medical writing suite with built-in PHI
            auto-detection. Identifiers are redacted in your browser before
            any text is sent.
          </p>

          <div className="flex justify-center mb-8">
            <Badge
              variant="success"
              className="gap-1.5 px-3 py-1 text-sm"
            >
              <Shield className="h-3.5 w-3.5" />
              Built-in PHI auto-detection &amp; redaction
            </Badge>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="gap-2">
                See Features <ArrowDown className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>


      {/* ── Section 1: Clinical Documentation ─────────────────── */}
      <section id="features" className="py-16 scroll-mt-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="border-l-4 border-blue-500 pl-6">
            <Badge variant="secondary" className="mb-3">Clinical Documentation</Badge>
            <h3 className="text-2xl font-bold mb-3">Write better clinical notes, faster</h3>
            <p className="text-muted-foreground mb-5">
              Generate complete A/P sections, prior auth letters, discharge
              summaries, and referral letters — all optimized for proper E&amp;M
              coding and maximum reimbursement.
            </p>
            <ul className="space-y-2.5">
              {clinicalFeatures.map((f) => (
                <li key={f.title} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">{f.title}</span>
                    <span className="text-muted-foreground"> — {f.description}</span>
                  </div>
                </li>
              ))}
            </ul>
            <FeaturePreview accent="blue">
              <ClinicalMockup />
            </FeaturePreview>
          </div>
        </div>
      </section>

      {/* ── Section 2: Academic Writing ────────────────────────── */}
      <section className="bg-muted/30 dark:bg-muted/10 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="border-l-4 border-emerald-500 pl-6">
            <Badge variant="secondary" className="mb-3">Academic Writing</Badge>
            <h3 className="text-2xl font-bold mb-3">From rough notes to polished manuscripts</h3>
            <p className="text-muted-foreground mb-5">
              Transform bullet points into journal-ready manuscripts. Find real
              citations from PubMed, never hallucinated. Respond to peer
              reviewers point-by-point.
            </p>
            <ul className="space-y-2.5">
              {academicFeatures.map((f) => (
                <li key={f.title} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">{f.title}</span>
                    <span className="text-muted-foreground"> — {f.description}</span>
                  </div>
                </li>
              ))}
            </ul>
            <FeaturePreview accent="emerald">
              <AcademicMockup />
            </FeaturePreview>
          </div>
        </div>
      </section>

      {/* ── Section 3: AI Writing Integrity ────────────────────── */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="border-l-4 border-violet-500 pl-6">
            <Badge variant="secondary" className="mb-3">AI Writing Integrity</Badge>
            <h3 className="text-2xl font-bold mb-3">Detect, humanize, and verify</h3>
            <p className="text-muted-foreground mb-5">
              Multi-source AI detection with consensus scoring. Rewrite
              AI-generated text to sound naturally human. Export compliance
              reports with signature lines.
            </p>
            <ul className="space-y-2.5">
              {aiIntegrityFeatures.map((f) => (
                <li key={f.title} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">{f.title}</span>
                    <span className="text-muted-foreground"> — {f.description}</span>
                  </div>
                </li>
              ))}
            </ul>
            <FeaturePreview accent="violet">
              <AiIntegrityMockup />
            </FeaturePreview>
          </div>
        </div>
      </section>

      {/* ── Section 4: Privacy-First ───────────────────────────── */}
      <section className="bg-muted/30 dark:bg-muted/10 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="border-l-4 border-green-500 pl-6">
            <Badge variant="secondary" className="mb-3">Privacy-First Architecture</Badge>
            <h3 className="text-2xl font-bold mb-3">Built-in PHI auto-detection</h3>
            <p className="text-muted-foreground mb-5">
              Detected identifiers are automatically redacted in your browser
              before any text leaves your device. Clinical details the AI needs
              pass through untouched.
            </p>
            <ul className="space-y-2.5">
              {privacyFeatures.map((f) => (
                <li key={f.title} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">{f.title}</span>
                    <span className="text-muted-foreground"> — {f.description}</span>
                  </div>
                </li>
              ))}
            </ul>
            <FeaturePreview accent="green">
              <PrivacyMockup />
            </FeaturePreview>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-12">
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.label} className="flex flex-col items-center gap-3">
                <div className="flex items-center justify-center rounded-full bg-primary/10 h-14 w-14 text-primary font-bold text-lg mb-2">
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Step {i + 1}
                </div>
                <p className="font-medium">{step.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Preview ────────────────────────────────────── */}
      <section className="bg-muted/30 dark:bg-muted/10 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Simple Pricing
          </h3>
          <p className="text-muted-foreground mb-10">
            Start free, upgrade when you need more.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl border p-6 text-center ${
                  tier.highlight
                    ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20"
                    : "bg-card"
                }`}
              >
                <h4 className="font-semibold text-lg mb-1">{tier.name}</h4>
                <div className="text-3xl font-bold mb-1">{tier.price}</div>
                <div className="text-xs text-muted-foreground mb-4">
                  {tier.period}
                </div>
                <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  {tier.quota}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/pricing">
              <Button variant="outline" className="gap-2">
                View Full Pricing <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t py-8 text-sm text-muted-foreground">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>Docs&sup2; &copy; 2026</span>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms of Use
            </Link>
            <a
              href="mailto:support@docsquared.app"
              className="hover:text-foreground transition-colors"
            >
              support@docsquared.app
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
