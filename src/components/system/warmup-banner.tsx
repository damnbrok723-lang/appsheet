"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Activity } from "lucide-react";

export function WarmupBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        if (!response.ok) {
          if (mounted) setShow(true);
          return;
        }

        if (mounted) setShow(false);
      } catch {
        if (mounted) setShow(true);
      }
    };

    check();
    const id = window.setInterval(check, 30000);

    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  if (!show) return null;

  return (
    <Alert variant="warning" className="mb-4 flex items-start gap-3">
      <Activity className="mt-0.5 h-4 w-4" />
      <div className="space-y-1">
        <AlertTitle>Server sedang menyala ulang</AlertTitle>
        <AlertDescription>
          Aplikasi sedang wake up dari kondisi idle. Mohon tunggu beberapa detik sebelum melanjutkan penggunaan.
        </AlertDescription>
      </div>
    </Alert>
  );
}
