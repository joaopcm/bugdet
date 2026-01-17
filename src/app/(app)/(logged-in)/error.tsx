"use client";

import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorComponent({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-2 text-destructive">
        <IconAlertTriangle className="size-6" />
        <h2 className="font-semibold text-lg">Something went wrong</h2>
      </div>
      <p className="text-muted-foreground text-sm">
        An error occurred while loading this page.
      </p>
      <Button onClick={reset} variant="outline">
        <IconRefresh className="mr-2 size-4" />
        Try again
      </Button>
    </div>
  );
}
