import Link from "next/link";
import {
  FileText,
  BookOpen,
  Wand2,
  ScanSearch,
  Quote,
  ArrowRight,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: FileText,
    title: "Clinical Note Citation",
    description:
      "Analyze clinical notes for ICD-10/CPT codes, documentation gaps, and billing optimization with AI-powered suggestions.",
  },
  {
    icon: BookOpen,
    title: "Manuscript Citations",
    description:
      "Identify claims needing references, suggest citations, and format bibliographies in APA, MLA, Chicago, Vancouver, and more.",
  },
  {
    icon: Wand2,
    title: "De-AI-ifier",
    description:
      "Transform AI-generated text into natural, human-sounding prose while preserving meaning and academic quality.",
  },
  {
    icon: ScanSearch,
    title: "AI Text Detector",
    description:
      "Detect AI-generated passages, highlight suspicious sections, and get targeted rewrites to eliminate the AI fingerprint.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Quote className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold tracking-tight">
              ex<span className="text-primary">CITE</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center">
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <Shield className="h-3.5 w-3.5" />
            HIPAA-compliant PHI auto-redaction
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Citation Intelligence
            <br />
            <span className="text-primary">for Healthcare & Academia</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            AI-powered tools to cite clinical notes for better billing,
            format academic manuscripts, humanize AI-generated text, and detect AI writing patterns.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                Start for Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <h2 className="text-2xl font-bold text-center mb-12">
            Four powerful tools, one platform
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-card p-6 hover:shadow-md transition-shadow"
              >
                <feature.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="max-w-6xl mx-auto px-4">
          exCITE &copy; {new Date().getFullYear()}. Citation Intelligence for Healthcare & Academia.
        </div>
      </footer>
    </div>
  );
}
