"use client";

import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <MobileNav />
        <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
        <footer className="border-t px-4 py-3 text-xs text-muted-foreground flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} exCITE</span>
          <div className="flex items-center gap-3">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
