"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  BookOpen,
  Wand2,
  ScanSearch,
  LayoutDashboard,
  History,
  Settings,
  LogOut,
  Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tools/clinical-notes", label: "Clinical Notes", icon: FileText },
  { href: "/tools/manuscript-citations", label: "Manuscript Citations", icon: BookOpen },
  { href: "/tools/de-ai-ify", label: "De-AI-ifier", icon: Wand2 },
  { href: "/tools/ai-detector", label: "AI Detector", icon: ScanSearch },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card min-h-screen">
      <div className="flex items-center gap-2 px-6 py-5 border-b">
        <Quote className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            ex<span className="text-primary">CITE</span>
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            Citation Intelligence
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
