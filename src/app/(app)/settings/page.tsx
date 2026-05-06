"use client";

import { useState, useEffect } from "react";
import { Settings, Key, Shield, Gift, Copy, Check, Users, Puzzle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ReferralData {
  code: string;
  bonus: number;
  totalReferrals: number;
  totalCredits: number;
}


export default function SettingsPage() {
  const [defaultStyle, setDefaultStyle] = useState("apa");
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setReferral)
      .catch(() => {});
  }, []);

  const referralUrl = referral
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/sign-up?ref=${referral.code}`
    : "";

  function handleCopy() {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success("Referral link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Configure your Docs&sup2; preferences
        </p>
      </div>

      {/* Referrals */}
      {referral && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              <CardTitle className="text-base">Refer a Colleague</CardTitle>
            </div>
            <CardDescription>
              Get {referral.bonus} bonus credits for every colleague who signs up using your link.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Your Referral Link</Label>
              <div className="flex gap-2">
                <Input
                  value={referralUrl}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button variant="outline" onClick={handleCopy} className="shrink-0">
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-xs">Sign-ups</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  {referral.totalReferrals}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Gift className="h-3.5 w-3.5" />
                  <span className="text-xs">Credits earned</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  {referral.totalCredits}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Bonus credits are added on top of your monthly limit and reset
              with each billing cycle.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Browser Extension info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Puzzle className="h-4 w-4" />
            <CardTitle className="text-base">Browser Extension</CardTitle>
          </div>
          <CardDescription>
            Highlight any text on any webpage and right-click to humanize
            or check it for AI patterns. Uses your existing login.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <a
            href="https://chrome.google.com/webstore/detail/docs-squared/PLACEHOLDER"
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="outline" className="w-full gap-2">
              <Puzzle className="h-4 w-4" />
              Install Chrome Extension
            </Button>
          </a>
          <p className="text-xs text-muted-foreground text-center">
            Works with Chrome, Edge, and Brave. No setup needed.
          </p>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <CardTitle className="text-base">API Configuration</CardTitle>
          </div>
          <CardDescription>
            API keys are configured via environment variables on the server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm font-medium">AI Engine</p>
              <p className="text-xs text-muted-foreground">Powers all AI-driven generation</p>
            </div>
            <Badge variant="outline">Server-side</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Citation Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <CardTitle className="text-base">Citation Preferences</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Citation Style</Label>
            <Select value={defaultStyle} onValueChange={setDefaultStyle}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apa">APA (7th Edition)</SelectItem>
                <SelectItem value="mla">MLA (9th Edition)</SelectItem>
                <SelectItem value="chicago">Chicago</SelectItem>
                <SelectItem value="vancouver">Vancouver</SelectItem>
                <SelectItem value="harvard">Harvard</SelectItem>
                <SelectItem value="ieee">IEEE</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <CardTitle className="text-base">Privacy & Security</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm font-medium">PHI Auto-Redaction</p>
              <p className="text-xs text-muted-foreground">
                Automatically detect and redact Protected Health Information
              </p>
            </div>
            <Badge variant="success">Always On</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm font-medium">HIPAA Compliance Mode</p>
              <p className="text-xs text-muted-foreground">
                All text is scanned for SSN, MRN, DOB, addresses, and other PHI before processing
              </p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            PHI detection covers: Social Security Numbers, Medical Record Numbers,
            Phone Numbers, Email Addresses, Dates of Birth, Street Addresses,
            Patient Names, Insurance Numbers, and IP Addresses.
          </p>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input disabled placeholder="Connected via Better Auth" />
          </div>
          <Button variant="outline" className="text-destructive hover:text-destructive">
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
