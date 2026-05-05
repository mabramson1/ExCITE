"use client";

import { useEffect, useRef } from "react";
import { Mic, MicOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVoiceRecognition } from "@/hooks/use-voice-recognition";

interface VoiceInputProps {
  /** Called every time the transcript changes (final + interim concatenated). */
  onTranscript: (text: string) => void;
  /** Existing input text — appended to when user speaks. */
  currentText: string;
  /** Optional label override. */
  label?: string;
  /** Compact button style for inline use. */
  compact?: boolean;
}

/**
 * Reusable voice-to-text button. Uses the browser's SpeechRecognition API
 * (free, no API cost). Appends transcribed text to the existing input.
 */
export function VoiceInput({
  onTranscript,
  currentText,
  label,
  compact = false,
}: VoiceInputProps) {
  const { supported, listening, finalText, interimText, error, start, stop, reset } =
    useVoiceRecognition();

  // Track the text snapshot at the moment recording started so we can
  // append the new transcript to it (instead of replacing).
  const baseTextRef = useRef("");

  useEffect(() => {
    if (listening && baseTextRef.current === "") {
      baseTextRef.current = currentText.endsWith(" ") || currentText === ""
        ? currentText
        : currentText + " ";
    }
  }, [listening, currentText]);

  // Push transcript updates to parent
  useEffect(() => {
    if (!listening && !finalText && !interimText) return;
    const combined = baseTextRef.current + finalText + interimText;
    if (combined !== currentText) {
      onTranscript(combined);
    }
  }, [finalText, interimText, listening, onTranscript, currentText]);

  // Reset baseline when user stops
  useEffect(() => {
    if (!listening) {
      baseTextRef.current = "";
    }
  }, [listening]);

  if (!supported) {
    return null;
  }

  if (compact) {
    return (
      <Button
        type="button"
        variant={listening ? "destructive" : "outline"}
        size="sm"
        onClick={listening ? stop : start}
        className="gap-1.5"
      >
        {listening ? (
          <>
            <MicOff className="h-3.5 w-3.5" />
            Stop
          </>
        ) : (
          <>
            <Mic className="h-3.5 w-3.5" />
            {label ?? "Speak"}
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant={listening ? "destructive" : "outline"}
          size="sm"
          onClick={listening ? stop : start}
          className="gap-1.5"
        >
          {listening ? (
            <>
              <MicOff className="h-3.5 w-3.5" />
              Stop recording
            </>
          ) : (
            <>
              <Mic className="h-3.5 w-3.5" />
              {label ?? "Dictate"}
            </>
          )}
        </Button>
        {listening && (
          <Badge
            variant="destructive"
            className="gap-1.5 animate-pulse"
          >
            <span className="h-2 w-2 rounded-full bg-current" />
            Listening
          </Badge>
        )}
        {(finalText || interimText) && !listening && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={reset}
            className="gap-1.5 text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">
          {error === "not-allowed"
            ? "Microphone access denied. Enable mic permissions for this site."
            : error === "no-speech"
            ? "No speech detected. Try again."
            : `Error: ${error}`}
        </p>
      )}
      {!error && listening && (
        <p className="text-xs text-muted-foreground">
          Speak naturally. Click &ldquo;Stop&rdquo; when done. Audio stays on your device.
        </p>
      )}
    </div>
  );
}
