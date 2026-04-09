"use client";

import { useState } from "react";
import { Settings, Key, Shield, Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SettingsPage() {
  const [defaultStyle, setDefaultStyle] = useState("apa");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Configure your exCITE preferences
        </p>
      </div>

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
              <p className="text-sm font-medium">Anthropic (Claude) API</p>
              <p className="text-xs text-muted-foreground">Used for all AI-powered features</p>
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
