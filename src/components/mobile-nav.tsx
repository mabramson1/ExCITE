"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "next-themes";
import {
  FileText,
  BookOpen,
  Wand2,
  ScanSearch,
  LayoutDashboard,
  History,
  Settings,
  Menu,
  X,
  Quote,
  Sun,
  Moon,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tools/clinical-notes", label: "Clinical Notes", icon: FileText },
  { href: "/tools/manuscript-citations", label: "Manuscripts", icon: BookOpen },
  { href: "/tools/de-ai-ify", label: "De-AI-ifier", icon: Wand2 },
  { href: "/tools/ai-detector", label: "AI Detector", icon: ScanSearch },
  { href: "/history", label: "History", icon: History },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Quote className="h-6 w-6 text-primary" />
          <span className="font-bold">
            ex<span className="text-primary">CITE</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="cursor-pointer p-1"
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="h-4 w-4 hidden dark:block" />
          </button>
          <button onClick={() => setOpen(!open)} className="cursor-pointer">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-b bg-card px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
