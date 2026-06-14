"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ArtifactIframeRunnerProps {
  code: string;
  className?: string;
  onStatusChange?: (status: "loading" | "ready" | "error", message?: string) => void;
  isResizing?: boolean;
}

export const ArtifactIframeRunner: React.FC<ArtifactIframeRunnerProps> = ({
  code,
  className,
  onStatusChange,
  isResizing = false,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const renderId = useMemo(() => crypto.randomUUID(), [code]);

  useEffect(() => {
    setErrorMessage(null);
    onStatusChange?.("loading");
  }, [code, onStatusChange]);

  useEffect(() => {
    if (!iframeReady) return;
    const target = iframeRef.current?.contentWindow;
    if (!target) return;
    target.postMessage({ code, renderId }, "*");
  }, [code, iframeReady, renderId]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      // sandboxed iframe without allow-same-origin reports origin "null"
      if (event.origin !== "null" && event.origin !== window.location.origin) {
        return;
      }
      const data = event.data || {};
      if (data.renderId !== renderId) return;
      if (data.status === "error") {
        setErrorMessage(data.message || "Failed to render artifact.");
        onStatusChange?.("error", data.message);
      } else if (data.status === "ok") {
        setErrorMessage(null);
        onStatusChange?.("ready");
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [renderId, onStatusChange]);

  return (
    <div className={cn("relative h-full w-full", className)}>
      <iframe
        ref={iframeRef}
        title="Artifact preview"
        sandbox="allow-scripts"
        src="/artifact-runner"
        className="h-full w-full border-0"
        style={{ pointerEvents: isResizing ? "none" : "auto" }}
        onLoad={() => setIframeReady(true)}
      />
      {errorMessage && (
        <div className="absolute inset-0 pointer-events-none flex items-start justify-start p-4">
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 shadow-sm">
            {errorMessage}
          </div>
        </div>
      )}
    </div>
  );
};


