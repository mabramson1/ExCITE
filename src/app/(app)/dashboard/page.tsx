"use client";

import Link from "next/link";
import {
  FileText,
  BookOpen,
  Wand2,
  ScanSearch,
  ArrowRight,
  TrendingUp,
  Clock,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

const stats = [
  { icon: TrendingUp, label: "Analyses Run", value: "--" },
  { icon: Clock, label: "Time Saved", value: "--" },
  { icon: Zap, label: "Citations Generated", value: "--" },
];

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Choose a tool to get started with your citation workflow.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
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

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. Select a tool above based on your task</p>
          <p>2. Paste or type your text into the input area</p>
          <p>3. Any PHI (Protected Health Information) is automatically detected and redacted</p>
          <p>4. Review your AI-powered results and export as needed</p>
        </CardContent>
      </Card>
    </div>
  );
}
