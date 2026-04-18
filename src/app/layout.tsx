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
    default: "exCITE — Citation Intelligence for Healthcare & Academia",
    template: "%s — exCITE",
  },
  description:
    "AI-powered tools to cite clinical notes, format manuscripts, humanize AI text, and detect AI writing. HIPAA-compliant PHI auto-redaction.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://ex-cite.vercel.app"),
  openGraph: {
    title: "exCITE — Citation Intelligence for Healthcare & Academia",
    description:
      "AI-powered tools to cite clinical notes, format manuscripts, humanize AI text, and detect AI writing.",
    type: "website",
    siteName: "exCITE",
  },
  twitter: {
    card: "summary_large_image",
    title: "exCITE — Citation Intelligence for Healthcare & Academia",
    description:
      "AI-powered tools to cite clinical notes, format manuscripts, humanize AI text, and detect AI writing.",
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
