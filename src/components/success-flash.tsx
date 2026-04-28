"use client";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

export function SuccessFlash({ show }: { show: boolean }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (show) {
      setFading(false);
      const fadeTimer = setTimeout(() => setFading(true), 1200);
      return () => clearTimeout(fadeTimer);
    }
    setFading(false);
  }, [show]);

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}>
      <div className="bg-green-500 text-white rounded-full p-4 shadow-lg animate-bounce">
        <CheckCircle2 className="h-8 w-8" />
      </div>
    </div>
  );
}
