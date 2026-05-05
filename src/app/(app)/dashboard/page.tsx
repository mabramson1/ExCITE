"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  BookOpen,
  Wand2,
  ScanSearch,
  ArrowRight,
  TrendingUp,
  Clock,
  Star,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UsageMeter } from "@/components/usage-meter";
import { QuickStart } from "@/components/quick-start";
import { useSession } from "@/lib/auth-client";

const tools = [
  {
    href: "/tools/clinical-notes",
    icon: FileText,
    title: "Clinical Notes",
    description: "Cite notes with ICD-10 & CPT codes for better billing and documentation.",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
  },
  {
    href: "/tools/manuscript-citations",
    icon: BookOpen,
    title: "Manuscript Citations",
    description: "Format and find citations in APA, MLA, Chicago, Vancouver, and more.",
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    href: "/tools/de-ai-ify",
    icon: Wand2,
    title: "De-AI-ifier",
    description: "Rewrite AI-generated text to sound naturally human-written.",
    color: "text-violet-600 bg-violet-50 dark:bg-violet-950/40",
  },
  {
    href: "/tools/ai-detector",
    icon: ScanSearch,
    title: "AI Text Detector",
    description: "Detect AI patterns, get a confidence score, and fix flagged sections.",
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
  },
];

const TYPE_TOOL_MAP: Record<string, { href: string; label: string }> = {
  ai_detect: { href: "/tools/ai-detector", label: "AI Detector" },
  "de-ai-ify": { href: "/tools/de-ai-ify", label: "De-AI-ifier" },
  clinical_note: { href: "/tools/clinical-notes", label: "Clinical Notes" },
  ap_writer: { href: "/tools/clinical-notes", label: "A/P Writer" },
  manuscript: { href: "/tools/manuscript-citations", label: "Citations" },
  review_response: { href: "/tools/manuscript-citations", label: "Review Response" },
  manuscript_writer: { href: "/tools/manuscript-citations", label: "Write Manuscript" },
};

interface Project {
  id: string;
  title?: string;
  type?: string;
  createdAt: string;
  favorite?: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, favorites: 0 });
  const [recent, setRecent] = useState<Project[]>([]);
  const [isNewUser, setIsNewUser] = useState(false);

  // Redeem any pending referral code from sessionStorage (set during signup
  // pre-OAuth, redeemed once user lands here post-auth).
  useEffect(() => {
    const code = sessionStorage.getItem("docsq-referral-code");
    if (!code) return;
    sessionStorage.removeItem("docsq-referral-code");
    fetch("/api/referral/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/history").then(r => r.ok ? r.json() : { projects: [] }).then(data => {
      const projects: Project[] = data.projects || [];
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      setIsNewUser(projects.length === 0);
      setStats({
        total: projects.length,
        thisWeek: projects.filter(p => new Date(p.createdAt).getTime() > weekAgo).length,
        favorites: projects.filter(p => p.favorite).length,
      });
      setRecent(projects.slice(0, 5));
    }).catch(() => {});
  }, []);

  const statCards = [
    { icon: TrendingUp, label: "Analyses Run", value: stats.total },
    { icon: Clock, label: "This Week", value: stats.thisWeek },
    { icon: Star, label: "Favorites", value: stats.favorites },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Choose a tool to get started with your citation workflow.
        </p>
      </div>

      {/* Quick Start for new users */}
      {isNewUser && <QuickStart userName={session?.user?.name} />}

      {/* Quick Stats + Usage Meter */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid grid-cols-3 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <UsageMeter />
      </div>

      {/* Tools Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader>
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${tool.color}`}>
                  <tool.icon className="h-5 w-5" />
                </div>
                <CardTitle className="flex items-center gap-2">
                  {tool.title}
                  <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Analyses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Analyses</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">
                Run your first analysis to see it here.
              </p>
              <Link
                href="/tools/ai-detector"
                className="text-sm text-primary hover:underline"
              >
                Get started with AI Text Detector
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((project) => {
                const toolInfo = TYPE_TOOL_MAP[project.type || ""] || {
                  href: "/dashboard",
                  label: project.type || "Analysis",
                };
                const title =
                  project.title && project.title.length > 60
                    ? project.title.slice(0, 60) + "..."
                    : project.title || "Untitled";
                return (
                  <Link
                    key={project.id}
                    href={`${toolInfo.href}?load=${project.id}`}
                  >
                    <div className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{title}</p>
                          <p className="text-xs text-muted-foreground">
                            {timeAgo(project.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {toolInfo.label}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
