import { useState, useEffect } from "react";

const MESSAGES = [
  "Scanning for PHI...",
  "Sending to AI...",
  "Processing results...",
  "Almost there...",
];

export function useProgressMessage(loading: boolean): string {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!loading) { setIndex(0); return; }
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % MESSAGES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [loading]);

  return loading ? MESSAGES[index] : "";
}
