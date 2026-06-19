"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this would report to an error service.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-danger/30 bg-danger-dim text-danger">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-content">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-muted">
        An unexpected error occurred while rendering this page.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
        <Button variant="secondary" onClick={() => (window.location.href = "/")}>
          Back home
        </Button>
      </div>
    </div>
  );
}
