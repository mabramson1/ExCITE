"use client";

import { useState, useCallback, useRef } from "react";

interface StreamingState {
  streaming: boolean;
  streamedText: string;
  result: string | null;
  usage: { input_tokens: number; output_tokens: number } | null;
  error: string | null;
}

const INITIAL_STATE: StreamingState = {
  streaming: false,
  streamedText: "",
  result: null,
  usage: null,
  error: null,
};

/**
 * React hook that manages an SSE streaming connection to a Claude-backed
 * API route.  Tokens are accumulated for a live preview; once streaming
 * finishes the full text and usage are surfaced so the caller can parse
 * the complete JSON response.
 */
export function useStreaming() {
  const [state, setState] = useState<StreamingState>(INITIAL_STATE);
  // Keep a ref so the returned promise resolves with the final values.
  const resultRef = useRef<{ text: string; usage: StreamingState["usage"] } | null>(null);

  const startStream = useCallback(
    async (
      url: string,
      body: object
    ): Promise<{ text: string; usage: StreamingState["usage"] } | null> => {
      setState({ streaming: true, streamedText: "", result: null, usage: null, error: null });
      resultRef.current = null;

      try {
        const separator = url.includes("?") ? "&" : "?";
        const res = await fetch(`${url}${separator}stream=true`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          let errorMsg = "Streaming request failed";
          try {
            const data = await res.json();
            errorMsg = data.error || errorMsg;
            // Surface credit info so callers can handle 402
            if (res.status === 402 && data.credit) {
              setState((s) => ({ ...s, streaming: false, error: errorMsg }));
              // Re-throw so caller can inspect status
              throw { status: res.status, data };
            }
          } catch (e) {
            if (e && typeof e === "object" && "status" in e) throw e;
          }
          setState((s) => ({ ...s, streaming: false, error: errorMsg }));
          return null;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE events are separated by double newlines
          const parts = buffer.split("\n\n");
          // The last part may be incomplete — keep it in the buffer
          buffer = parts.pop() || "";

          for (const part of parts) {
            for (const line of part.split("\n")) {
              if (!line.startsWith("data: ")) continue;
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === "token") {
                  accumulated += data.text;
                  setState((s) => ({ ...s, streamedText: accumulated }));
                } else if (data.type === "done") {
                  resultRef.current = { text: data.text, usage: data.usage };
                  setState((s) => ({
                    ...s,
                    streaming: false,
                    result: data.text,
                    usage: data.usage,
                  }));
                }
              } catch {
                // Skip malformed JSON lines
              }
            }
          }
        }

        return resultRef.current;
      } catch (e) {
        // Re-throw credit errors for caller handling
        if (e && typeof e === "object" && "status" in e) throw e;
        setState((s) => ({ ...s, streaming: false, error: "Network error during streaming" }));
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    resultRef.current = null;
  }, []);

  return { ...state, startStream, reset };
}
