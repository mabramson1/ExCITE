import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Docs² — Docs for Docs",
    template: "%s — Docs²",
  },
  description:
    "AI-powered medical writing suite: cite clinical notes, generate manuscripts, humanize AI text, and detect AI patterns. HIPAA-compliant.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://docsquared.app"),
  openGraph: {
    title: "Docs² — Docs for Docs",
    description:
      "AI-powered medical writing suite: cite clinical notes, generate manuscripts, humanize AI text, and detect AI patterns. HIPAA-compliant.",
    type: "website",
    siteName: "Docs²",
  },
  twitter: {
    card: "summary_large_image",
    title: "Docs² — Docs for Docs",
    description:
      "AI-powered medical writing suite: cite clinical notes, generate manuscripts, humanize AI text, and detect AI patterns. HIPAA-compliant.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
