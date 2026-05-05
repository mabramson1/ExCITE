"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Minimal type definitions for the Web Speech API (not in TS lib by default)
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item: (i: number) => SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item: (i: number) => SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface VoiceState {
  supported: boolean;
  listening: boolean;
  finalText: string;
  interimText: string;
  error: string | null;
}

/**
 * Browser-native speech recognition. Free, runs entirely in the browser
 * (no API costs), works offline in modern Chrome/Edge/Safari.
 *
 * Usage:
 *   const { listening, finalText, interimText, start, stop, reset, supported } = useVoiceRecognition();
 *   <button onClick={listening ? stop : start}>{listening ? "Stop" : "Speak"}</button>
 */
export function useVoiceRecognition(opts?: { lang?: string }) {
  const [state, setState] = useState<VoiceState>({
    supported: false,
    listening: false,
    finalText: "",
    interimText: "",
    error: null,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTextRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const Ctor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setState((s) => ({ ...s, supported: false }));
      return;
    }
    setState((s) => ({ ...s, supported: true }));
  }, []);

  const start = useCallback(() => {
    if (typeof window === "undefined") return;
    const Ctor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return;

    // Reset transcript on new session
    finalTextRef.current = "";

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = opts?.lang ?? "en-US";

    recognition.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalTextRef.current += transcript;
        } else {
          interim += transcript;
        }
      }
      setState((s) => ({
        ...s,
        finalText: finalTextRef.current,
        interimText: interim,
        error: null,
      }));
    };

    recognition.onerror = (e) => {
      setState((s) => ({
        ...s,
        error: e.error || "Speech recognition error",
      }));
    };

    recognition.onend = () => {
      setState((s) => ({ ...s, listening: false, interimText: "" }));
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setState((s) => ({ ...s, listening: true, error: null }));
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : "Failed to start",
      }));
    }
  }, [opts?.lang]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    recognitionRef.current?.abort();
    finalTextRef.current = "";
    setState((s) => ({
      ...s,
      finalText: "",
      interimText: "",
      listening: false,
      error: null,
    }));
  }, []);

  return {
    ...state,
    start,
    stop,
    reset,
  };
}
