import { useEffect } from "react";

export function useKeyboardSubmit(
  onSubmit: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        onSubmit();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSubmit, enabled]);
}
