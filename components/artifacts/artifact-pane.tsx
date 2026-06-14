"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, Code2, List, Copy, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ArtifactViewer } from "./artifact-viewer";
import { ArtifactCodeView } from "./artifact-code-view";
import { ResizeHandle } from "./resize-handle";
import { Button } from "@/components/ui/button";
import type { Artifact, ArtifactViewMode } from "@/lib/types/artifact";

interface ArtifactPaneProps {
  artifact: Artifact | null;
  isOpen: boolean;
  onClose: () => void;
  onResize?: (width: number) => void;
  paneWidth?: number;
  className?: string;
}

export const ArtifactPane: React.FC<ArtifactPaneProps> = ({
  artifact,
  isOpen,
  onClose,
  onResize,
  paneWidth = 600,
  className,
}) => {
  const [viewMode, setViewMode] = useState<ArtifactViewMode>("rendered");
  const [showArtifactList, setShowArtifactList] = useState(false);
  const [renderStatus, setRenderStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    // Only reset to loading when switching to a different artifact
    // The iframe runner will handle status updates for code changes
    if (artifact) {
      setRenderStatus("loading");
    }
  }, [artifact?.id]);

  useEffect(() => {
    console.log("[ArtifactPane] renderStatus changed:", renderStatus, "for artifact:", artifact?.id);
  }, [renderStatus, artifact?.id]);

  const handleViewerStatus = useCallback(
    (status: "loading" | "ready" | "error", message?: string) => {
      console.log("[ArtifactPane] viewer status update:", status, message);
      setRenderStatus(status);
    },
    [],
  );

  if (!artifact) return null;

  const handleCopy = () => {
    if (artifact.code) {
      navigator.clipboard.writeText(artifact.code);
    }
  };

  const showRendered = viewMode === "rendered";
  const showCode = viewMode === "code";
  const isError = renderStatus === "error";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 lg:hidden"
          />
          
          {/* Pane */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            style={{ width: `${paneWidth}px` }}
            className={cn(
              "fixed right-0 top-0 bottom-0 bg-background border-l border-border z-50",
              "flex flex-col shadow-2xl",
              className
            )}
          >
            {/* Resize Handle */}
            {onResize && (
              <ResizeHandle
                onResize={onResize}
                onDragStart={() => setIsResizing(true)}
                onDragEnd={() => setIsResizing(false)}
                minWidth={300}
                maxWidth={1200}
              />
            )}

            {/* Header with S feature buttons */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/30">
              <div className="flex items-center gap-3">
                {/* S Feature: Index/List button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowArtifactList(!showArtifactList)}
                  className="h-8 w-8"
                  title="Switch between artifacts"
                >
                  <List className="h-4 w-4" />
                </Button>

                {/* Segmented toggle */}
                <div
                  role="radiogroup"
                  aria-label="Artifact view mode"
                  className="group/segmented-control relative inline-flex h-8 w-fit cursor-pointer rounded-[.625rem] bg-muted text-sm font-medium"
                >
                  {[
                    { key: "rendered" as const, icon: Eye, label: "Preview" },
                    { key: "code" as const, icon: Code2, label: "Code" },
                  ].map((option, index) => {
                    const active = viewMode === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={option.label}
                        tabIndex={active ? -1 : 0}
                        onClick={() => setViewMode(option.key)}
                        className={cn(
                          "flex h-[30px] min-w-[3rem] items-center gap-1.5 px-3 text-muted-foreground transition-colors duration-200 focus-visible:outline-none",
                          active && "text-foreground",
                        )}
                      >
                        <option.icon className="h-4 w-4" />
                        <span className="text-xs font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 px-0.5 py-0.5 transition-[opacity] duration-200"
                  >
                    <div
                      className="h-full w-1/2 rounded-[.55rem] bg-background shadow-sm transition-transform duration-200"
                      style={{
                        transform: `translateX(${viewMode === "code" ? "100%" : "0%"})`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8"
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                >
                  <Share2 className="h-3.5 w-3.5 mr-1.5" />
                  Publish
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Artifact List (Y feature - when list button is clicked) */}
            <AnimatePresence>
              {showArtifactList && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-border bg-muted/50 overflow-hidden"
                >
                  <div className="p-2 space-y-1">
                    {/* Placeholder for artifact list - will be populated from context */}
                    <div className="px-3 py-2 rounded-md bg-background border border-border text-sm">
                      {artifact.title}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Title */}
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-2xl font-bold text-foreground">{artifact.title}</h2>
                {artifact.description && (
                  <p className="text-sm text-muted-foreground mt-1">{artifact.description}</p>
                )}
              </div>
              {renderStatus === "loading" && (
                <div className="px-6 py-2 border-b border-border flex items-center justify-center">
                  <div className="relative inline-block">
                    <h1 className="text-lg font-semibold tracking-tight text-foreground">
                      Rendering artifact...
                    </h1>
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div className="thinking-overlay h-full w-1/2 bg-gradient-to-r from-transparent via-black/60 to-transparent blur-xl" />
                    </div>
                  </div>
                </div>
              )}
              {isError && (
                <div className="px-6 py-2 border-b border-border bg-red-50 text-red-600 flex items-center gap-2 text-sm">
                  <span>Unable to render artifact. Check the code for errors.</span>
                </div>
              )}

              {/* Rendered View */}
              {showRendered && (
                <div className="relative flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto p-6">
                    <ArtifactViewer
                      code={artifact.code}
                      onStatusChange={handleViewerStatus}
                      isResizing={isResizing}
                    />
                  </div>
                </div>
              )}

              {/* Code View */}
              {showCode && (
                <div className="flex-1 overflow-y-auto border-t border-border">
                  <ArtifactCodeView code={artifact.code} />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

