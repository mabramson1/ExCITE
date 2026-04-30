"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const AdminContent = dynamic(() => import("./admin-content"), {
  ssr: false,
  loading: () => (
    <div className="max-w-6xl mx-auto flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

export default function AdminPage() {
  return <AdminContent />;
}
