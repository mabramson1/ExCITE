"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Wand2,
  ScanSearch,
  FileText,
  BookOpen,
  Loader2,
  Copy,
  Check,
  Replace,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession, signIn } from "@/lib/auth-client";
import { handleCreditError } from "@/lib/credit-error";
import { toast } from "sonner";

declare global {
  interface Window {
    Office?: {
      initialize: (callback: () => void) => void;
      onReady: (callback: (info: { host: string }) => void) => void;
    };
  }
}

type Tool = "humanize" | "detect" | "ap-writer" | "citations";

const TOOLS = [
  { id: "humanize" as Tool, icon: Wand2, label: "Humanize", color: "text-violet-600" },
  { id: "detect" as Tool, icon: ScanSearch, label: "Detect AI", color: "text-amber-600" },
  { id: "ap-writer" as Tool, icon: FileText, label: "A/P Writer", color: "text-blue-600" },
  { id: "citations" as Tool, icon: BookOpen, label: "Citations", color: "text-emerald-600" },
];

const ENDPOINTS: Record<Tool, string> = {
  humanize: "/api/analyze/de-ai-ify",
  detect: "/api/analyze/ai-detect",
  "ap-writer": "/api/analyze/ap-writer",
  citations: "/api/analyze/manuscript",
};

export default function WordAddinPage() {
  const { data: session, isPending } = useSession();
  const [officeReady, setOfficeReady] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool>("humanize");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load Office JS when running inside Word
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://appsforoffice.microsoft.com/lib/1/hosted/office.js";
    script.onload = () => {
      if (window.Office) {
        window.Office.onReady(() => setOfficeReady(true));
      }
    };
    script.onerror = () => {
      // Not running in Word, that's fine — work as a standalone page
      setOfficeReady(false);
    };
    document.head.appendChild(script);
  }, []);

  const getSelectedText = useCallback(async (): Promise<string> => {
    if (!officeReady) return input;
    return new Promise((resolve) => {
      // @ts-expect-error Office.context is available at runtime
      Office.context.document.getSelectedDataAsync(
        // @ts-expect-error Office.CoercionType available at runtime
        Office.CoercionType.Text,
        (asyncResult: { status: string; value: string }) => {
          if (asyncResult.status === "succeeded" && asyncResult.value?.trim()) {
            resolve(asyncResult.value.trim());
          } else {
            resolve(input);
          }
        }
      );
    });
  }, [officeReady, input]);

  const replaceSelectedText = useCallback(
    async (text: string) => {
      if (!officeReady) return;
      // @ts-expect-error Office.context is available at runtime
      Office.context.document.setSelectedDataAsync(text);
    },
    [officeReady]
  );

  async function handleRun() {
    let text = await getSelectedText();
    if (!text.trim()) {
      toast.error("Select text in your document first, or paste it below.");
      return;
    }
    setInput(text);
    setLoading(true);
    setResult(null);

    const endpoint = ENDPOINTS[selectedTool];
    const bodyKey =
      selectedTool === "ap-writer" ? "skeleton" : "text";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [bodyKey]: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (handleCreditError(res.status, data)) return;
        toast.error(data.error || "Request failed");
        return;
      }

      const r = data.result;
      if (selectedTool === "humanize") {
        setResult(r?.rewritten_text || JSON.stringify(r, null, 2));
      } else if (selectedTool === "detect") {
        const score = r?.consensus_score ?? r?.overall_ai_probability ?? 0;
        const pct = Math.round(score * 100);
        const verdict = (r?.consensus_verdict || r?.verdict || "unknown").replace(/_/g, " ");
        setResult(`AI probability: ${pct}%\nVerdict: ${verdict}\n\n${r?.reasoning || ""}`);
      } else if (selectedTool === "ap-writer") {
        if (r?.assessment_plan) {
          setResult(r.assessment_plan);
        } else if (r?.full_note) {
          setResult(r.full_note);
        } else {
          setResult(JSON.stringify(r, null, 2));
        }
      } else if (selectedTool === "citations") {
        const parts: string[] = [];
        if (r?.summary) parts.push(r.summary);
        if (r?.bibliography?.length) {
          parts.push("\nReferences:\n" + r.bibliography.join("\n"));
        }
        setResult(parts.join("\n") || JSON.stringify(r, null, 2));
      }

      toast.success("Done");
    } catch {
      toast.error("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Not signed in — show inline sign-in form
  if (!isPending && !session?.user) {
    return <WordAddinSignIn />;
  }

  return (
    <div className="p-3 space-y-3 max-w-[360px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold">Docs²</h1>
        {officeReady && (
          <Badge variant="success" className="text-[10px]">
            Word connected
          </Badge>
        )}
      </div>

      {/* Tool selector */}
      <div className="grid grid-cols-2 gap-1.5">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const active = selectedTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => {
                setSelectedTool(tool.id);
                setResult(null);
              }}
              className={`flex items-center gap-2 rounded-lg border p-2 text-xs font-medium transition-colors ${
                active
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${active ? "text-primary" : tool.color}`} />
              {tool.label}
            </button>
          );
        })}
      </div>

      {/* Input */}
      {!officeReady && (
        <Textarea
          placeholder="Paste text here (or select text in Word if running as an add-in)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          className="text-xs"
        />
      )}

      {officeReady && (
        <p className="text-xs text-muted-foreground text-center">
          Select text in your document, then click the button below.
        </p>
      )}

      {/* Run button */}
      <Button onClick={handleRun} disabled={loading} className="w-full gap-2">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            {TOOLS.find((t) => t.id === selectedTool)?.icon &&
              (() => {
                const Icon = TOOLS.find((t) => t.id === selectedTool)!.icon;
                return <Icon className="h-4 w-4" />;
              })()}
            Run {TOOLS.find((t) => t.id === selectedTool)?.label}
          </>
        )}
      </Button>

      {/* Result */}
      {result && (
        <Card>
          <CardContent className="pt-4 space-y-2">
            <pre className="text-xs whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
              {result}
            </pre>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 flex-1">
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              {officeReady && selectedTool === "humanize" && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => replaceSelectedText(result)}
                  className="gap-1.5 flex-1"
                >
                  <Replace className="h-3 w-3" />
                  Replace in doc
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-[10px] text-muted-foreground text-center">
        Each use costs 1 credit.{" "}
        <a href="https://docsquared.app/settings" target="_blank" rel="noreferrer" className="underline">
          Settings
        </a>
      </p>
    </div>
  );
}

function WordAddinSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");

    try {
      const result = await signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message || "Invalid credentials");
      }
      // useSession will detect the new session and re-render the parent
    } catch {
      setError("Sign-in failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <h1 className="text-lg font-bold">Docs²</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to use AI tools in Word.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2 text-xs text-destructive">
            {error}
          </div>
        )}
        <div className="space-y-1">
          <Label htmlFor="addin-email" className="text-xs">Email</Label>
          <Input
            id="addin-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="addin-pw" className="text-xs">Password</Label>
          <Input
            id="addin-pw"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-9 text-sm"
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <p className="text-[10px] text-muted-foreground text-center">
        Don&apos;t have an account?{" "}
        <a href="https://docsquared.app/sign-up" target="_blank" rel="noreferrer" className="underline">
          Sign up free
        </a>
      </p>
    </div>
  );
}
