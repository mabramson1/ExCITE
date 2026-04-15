import { db } from "@/lib/db";
import { project } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Auto-save an analysis result to the user's history.
 * Silently fails — saving should never block the response.
 */
export async function autoSaveProject(opts: {
  type: "clinical_note" | "manuscript" | "deai" | "ai_detector";
  inputText: string;
  outputText: unknown;
  citationStyle?: string | null;
  phiDetected?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<string | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) return null;

    // Auto-generate title from first ~60 chars of input
    const title = opts.inputText.slice(0, 60).replace(/\n/g, " ").trim() +
      (opts.inputText.length > 60 ? "..." : "");

    const [saved] = await db
      .insert(project)
      .values({
        userId: session.user.id,
        title,
        type: opts.type,
        inputText: opts.inputText,
        outputText: opts.outputText ? JSON.stringify(opts.outputText) : null,
        citationStyle: (opts.citationStyle as "apa" | "mla" | "chicago" | "vancouver" | "harvard" | "ieee") || null,
        metadata: opts.metadata || null,
        phiDetected: opts.phiDetected || false,
      })
      .returning({ id: project.id });

    return saved?.id || null;
  } catch (error) {
    console.error("Auto-save failed (non-blocking):", error);
    return null;
  }
}
