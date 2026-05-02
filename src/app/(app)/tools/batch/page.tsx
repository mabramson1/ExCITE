"use client";

import { useState, useRef, useCallback } from "react";
import {
  Layers,
  Loader2,
  Upload,
  Play,
  Download,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { handleCreditError } from "@/lib/credit-error";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { scanAndCensorPhi, deepReinject } from "@/lib/phi-detection";

interface ToolDef {
  id: string;
  label: string;
  endpoint: string;
  bodyKey: string;
  credits: number;
  extraFields?: Record<string, string>;
}

const TOOLS: ToolDef[] = [
  {
    id: "clinical_note",
    label: "Clinical Note Coding",
    endpoint: "/api/analyze/clinical-note",
    bodyKey: "text",
    credits: 1,
  },
  {
    id: "ap_writer",
    label: "A/P Writer",
    endpoint: "/api/analyze/ap-writer",
    bodyKey: "skeleton",
    credits: 1,
  },
  {
    id: "prior_auth",
    label: "Prior Auth Letter",
    endpoint: "/api/analyze/prior-auth",
    bodyKey: "skeleton",
    credits: 1,
    extraFields: { procedure: "See note", diagnosis: "See note" },
  },
  {
    id: "de_ai_ify",
    label: "De-AI-ifier",
    endpoint: "/api/analyze/de-ai-ify",
    bodyKey: "text",
    credits: 1,
  },
  {
    id: "ai_detector",
    label: "AI Detector",
    endpoint: "/api/analyze/ai-detect",
    bodyKey: "text",
    credits: 1,
  },
  {
    id: "manuscript_citations",
    label: "Manuscript Citations",
    endpoint: "/api/analyze/manuscript",
    bodyKey: "text",
    credits: 1,
  },
  {
    id: "discharge",
    label: "Discharge Summary",
    endpoint: "/api/analyze/discharge",
    bodyKey: "skeleton",
    credits: 2,
    extraFields: { admitReason: "See note" },
  },
  {
    id: "referral",
    label: "Referral Letter",
    endpoint: "/api/analyze/referral",
    bodyKey: "skeleton",
    credits: 1,
    extraFields: { referTo: "See note", reason: "See note" },
  },
];

type ToolId = string;

interface BatchItem {
  id: number;
  text: string;
  status: "pending" | "processing" | "done" | "error";
  result?: unknown;
  error?: string;
}

export default function BatchPage() {
  const [tool, setTool] = useState<ToolId>("clinical_note");
  const [rawInput, setRawInput] = useState("");
  const [items, setItems] = useState<BatchItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const abortRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedTool = TOOLS.find((t) => t.id === tool)!;

  const parseItems = useCallback(() => {
    const lines = rawInput
      .split(/\n---\n|\n\n\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      toast.error("No items found. Separate items with --- or triple newlines.");
      return;
    }
    setItems(
      lines.map((text, i) => ({ id: i, text, status: "pending" as const }))
    );
    toast.success(`${lines.length} item${lines.length === 1 ? "" : "s"} loaded`);
  }, [rawInput]);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) {
      toast.error("File too large (max 2MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      if (file.name.endsWith(".csv")) {
        const rows = content
          .split("\n")
          .slice(1)
          .map((r) => r.trim())
          .filter(Boolean);
        setRawInput(rows.join("\n---\n"));
        toast.success(`Loaded ${rows.length} rows from CSV`);
      } else {
        setRawInput(content);
        toast.success(`Loaded ${file.name}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function processAll() {
    if (items.length === 0) return;
    setProcessing(true);
    abortRef.current = false;
    setProgress({ done: 0, total: items.length });

    const totalCredits = items.length * selectedTool.credits;

    for (let i = 0; i < items.length; i++) {
      if (abortRef.current) break;

      setItems((prev) =>
        prev.map((item) =>
          item.id === i ? { ...item, status: "processing" } : item
        )
      );

      try {
        const phi = scanAndCensorPhi(items[i].text);
        const body: Record<string, unknown> = {
          [selectedTool.bodyKey]: phi.censoredText,
          ...(selectedTool.extraFields ?? {}),
        };

        const res = await fetch(selectedTool.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
          if (handleCreditError(res.status, data)) {
            abortRef.current = true;
            setItems((prev) =>
              prev.map((item) =>
                item.id === i
                  ? { ...item, status: "error", error: "Out of credits" }
                  : item.status === "pending"
                  ? item
                  : item
              )
            );
            break;
          }
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        const restored = phi.hasPhi
          ? deepReinject(data.result, phi.tokenMap)
          : data.result;

        setItems((prev) =>
          prev.map((item) =>
            item.id === i
              ? { ...item, status: "done", result: restored }
              : item
          )
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === i
              ? {
                  ...item,
                  status: "error",
                  error: err instanceof Error ? err.message : "Unknown error",
                }
              : item
          )
        );
      }

      setProgress((p) => ({ ...p, done: i + 1 }));
    }

    setProcessing(false);
    if (!abortRef.current) {
      toast.success("Batch processing complete");
    }
  }

  function downloadResults() {
    const completed = items.filter((i) => i.status === "done");
    if (completed.length === 0) {
      toast.error("No completed results to download");
      return;
    }

    const output = completed.map((item, idx) => ({
      item_number: idx + 1,
      input: item.text.slice(0, 200),
      result: item.result,
    }));

    const blob = new Blob([JSON.stringify(output, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `docsq-batch-${tool}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${completed.length} results`);
  }

  const doneCount = items.filter((i) => i.status === "done").length;
  const errorCount = items.filter((i) => i.status === "error").length;
  const pctDone =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Layers className="h-6 w-6" />
          Batch Processing
        </h1>
        <p className="text-muted-foreground">
          Process multiple items through any tool at once. Separate items with{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">---</code> or
          triple newlines.
        </p>
      </div>

      {/* Tool selector + input */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">Setup</CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={tool}
                onValueChange={(v) => setTool(v as ToolId)}
              >
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOOLS.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}{" "}
                      <span className="text-muted-foreground">
                        ({t.credits}cr)
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder={`Paste items here, separated by --- or triple newlines.\n\nExample:\nPatient 1 note text here...\n---\nPatient 2 note text here...`}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            rows={8}
            className="font-mono text-xs"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={parseItems} disabled={!rawInput.trim()}>
              Parse Items
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-1.5" />
              Upload File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv"
              className="hidden"
              onChange={handleFileUpload}
            />
            {items.length > 0 && (
              <span className="text-sm text-muted-foreground ml-auto">
                {items.length} item{items.length === 1 ? "" : "s"} ·{" "}
                {items.length * selectedTool.credits} credits
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items preview + progress */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-base">
                Items ({doneCount}/{items.length} complete
                {errorCount > 0 && `, ${errorCount} failed`})
              </CardTitle>
              <div className="flex items-center gap-2">
                {!processing && doneCount > 0 && (
                  <Button variant="outline" size="sm" onClick={downloadResults}>
                    <Download className="h-4 w-4 mr-1.5" />
                    Download Results
                  </Button>
                )}
                {processing ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      abortRef.current = true;
                    }}
                  >
                    <X className="h-4 w-4 mr-1.5" />
                    Stop
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={processAll}
                    disabled={items.every(
                      (i) => i.status === "done" || i.status === "error"
                    )}
                  >
                    <Play className="h-4 w-4 mr-1.5" />
                    Process All
                  </Button>
                )}
              </div>
            </div>
            {processing && (
              <div className="space-y-1 pt-2">
                <Progress value={pctDone} />
                <p className="text-xs text-muted-foreground text-right">
                  {progress.done}/{progress.total} ({pctDone}%)
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg border text-sm"
                >
                  <div className="shrink-0 mt-0.5">
                    {item.status === "pending" && (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    {item.status === "processing" && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    {item.status === "done" && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    {item.status === "error" && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">
                      #{item.id + 1}: {item.text.slice(0, 120)}
                      {item.text.length > 120 ? "…" : ""}
                    </p>
                    {item.error && (
                      <p className="text-xs text-red-500 mt-1">{item.error}</p>
                    )}
                    {item.status === "done" && (
                      <Badge
                        variant="outline"
                        className="mt-1 text-green-600"
                      >
                        Complete
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <p>
          Each item is processed individually and counts against your monthly
          credits. PHI is auto-redacted per item before sending. Processing
          can be stopped at any time.
        </p>
      </div>
    </div>
  );
}
