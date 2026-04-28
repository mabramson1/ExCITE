"use client";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

export function SuccessFlash({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-green-500 text-white rounded-full p-4 animate-bounce shadow-lg">
        <CheckCircle2 className="h-8 w-8" />
      </div>
    </div>
  );
}
